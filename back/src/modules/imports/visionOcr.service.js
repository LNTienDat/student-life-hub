const dns = require('node:dns');
const { FINANCE, THOIKHOABIEU } = require('../../constants');
const { cauHinhAI } = require('../chatbot/gemini.service');

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const VISION_TIMEOUT_MS = 20000;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const RECEIPT_AMOUNT_WARNING = 'Chưa xác định chắc số tiền tổng. Hãy kiểm tra và nhập lại số tiền.';
const RECEIPT_DATE_WARNING = 'Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.';

function visionError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

function cleanText(value, maxLength = 200) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function validDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return '';
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() + 1 !== Number(m) || date.getUTCDate() !== Number(d)) {
    return '';
  }
  return `${y}-${m}-${d}`;
}

function validClock(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  return match ? `${match[1]}:${match[2]}` : '';
}

function parseVisionInput(body = {}) {
  const { kind, imageBase64, mimeType = 'image/jpeg', dongYGuiAI } = body || {};
  if (!['receipt', 'timetable'].includes(kind)) {
    throw visionError(400, 'OCR_AI_KIND', 'Loại ảnh quét AI chỉ hỗ trợ receipt hoặc timetable.');
  }
  if (dongYGuiAI !== true) {
    throw visionError(400, 'OCR_AI_CONSENT', 'Cần xác nhận đồng ý gửi ảnh đến Google AI trước khi quét.');
  }
  let normalizedMime = String(mimeType || '').toLowerCase().trim();
  let rawBase64 = String(imageBase64 || '').trim();
  const dataUrl = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(rawBase64);
  if (dataUrl) {
    normalizedMime = dataUrl[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : dataUrl[1].toLowerCase();
    rawBase64 = dataUrl[2].trim();
  }
  if (normalizedMime === 'image/jpg') normalizedMime = 'image/jpeg';
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw visionError(400, 'OCR_AI_MIME', 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
  }
  if (!rawBase64 || rawBase64.length > 3_800_000 || !/^[A-Za-z0-9+/=]+$/.test(rawBase64)) {
    throw visionError(400, 'OCR_AI_IMAGE', 'Dữ liệu ảnh không hợp lệ hoặc quá dung lượng cho phép.');
  }
  const buffer = Buffer.from(rawBase64, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw visionError(400, 'OCR_AI_IMAGE_SIZE', 'Ảnh gửi AI tối đa 2.5 MB.');
  }
  return { kind, mimeType: normalizedMime, base64Data: rawBase64 };
}

function normalizeReceiptAi(raw, model) {
  const loai = raw?.loai === 'thu' ? 'thu' : 'chi';
  const allowedCategories = loai === 'thu' ? FINANCE.DANH_MUC_THU : FINANCE.DANH_MUC_CHI;
  const danhMuc = allowedCategories.includes(raw?.danhMuc) ? raw.danhMuc : 'khac';
  const numericAmount = Math.round(Number(raw?.soTien));
  const soTien = Number.isSafeInteger(numericAmount) && numericAmount > 0 && numericAmount <= 1_000_000_000
    ? String(numericAmount)
    : '';
  const ngayGiaoDich = validDateString(raw?.ngayGiaoDich);
  const moTa = cleanText(raw?.moTa, 200) || 'Hóa đơn';
  const warnings = [];
  if (!soTien) warnings.push(RECEIPT_AMOUNT_WARNING);
  if (!ngayGiaoDich) warnings.push(RECEIPT_DATE_WARNING);
  return {
    loai,
    danhMuc,
    soTien,
    ngayGiaoDich,
    moTa,
    warnings,
    text: cleanText(raw?.ghiChu, 500),
    nguon: 'ai_vision',
    model,
  };
}

function normalizeTimetableAi(raw, model) {
  const rawRows = Array.isArray(raw?.rows) ? raw.rows : [];
  const rows = [];
  for (const item of rawRows.slice(0, 100)) {
    const tenMon = cleanText(item?.tenMon, THOIKHOABIEU.MAX_TEN_MON_LENGTH);
    const thu = Number(item?.thu);
    const gioBatDau = validClock(item?.gioBatDau);
    const gioKetThuc = validClock(item?.gioKetThuc);
    if (!tenMon || !Number.isInteger(thu) || thu < THOIKHOABIEU.THU_MIN || thu > THOIKHOABIEU.THU_MAX) continue;
    if (!gioBatDau || !gioKetThuc || gioKetThuc <= gioBatDau) continue;
    rows.push({
      tenMon,
      thu,
      gioBatDau,
      gioKetThuc,
      phongHoc: cleanText(item?.phongHoc, THOIKHOABIEU.MAX_PHONG_HOC_LENGTH),
      giangVien: cleanText(item?.giangVien, THOIKHOABIEU.MAX_GIANG_VIEN_LENGTH),
    });
  }
  return { rows, nguon: 'ai_vision', model };
}

function buildVisionRequest(kind) {
  if (kind === 'receipt') {
    return {
      prompt: [
        'Hãy đọc ảnh hóa đơn / biên lai tiếng Việt (hoặc song ngữ) này và trích xuất đúng thông tin giao dịch.',
        'Quy tắc:',
        '- soTien: tổng tiền thanh toán cuối cùng tính bằng VND (chỉ trả số nguyên, ví dụ 3976000 hoặc 54000; bỏ dấu chấm/phẩy ngăn cách nghìn; nếu là ngoại tệ USD/EUR không ghi rõ VND hoặc không chắc chắn thì trả 0).',
        '- ngayGiaoDich: ngày giao dịch theo định dạng YYYY-MM-DD (nếu năm viết tắt 2 số như 11.02.16 thì hiểu là 2016-02-11; nếu không chắc thì trả chuỗi rỗng "").',
        '- loai: "chi" hoặc "thu" (thông thường hóa đơn mua hàng là "chi").',
        `- danhMuc: chọn 1 trong ${FINANCE.DANH_MUC_CHI.join(', ')} nếu chi, hoặc ${FINANCE.DANH_MUC_THU.join(', ')} nếu thu.`,
        '- moTa: tên cửa hàng/quán hoặc nội dung ngắn gọn nhất (tối đa 80 ký tự).',
        '- ghiChu: tóm tắt ngắn các món chính nếu có.',
      ].join('\n'),
      schema: {
        type: 'OBJECT',
        required: ['loai', 'danhMuc', 'soTien', 'ngayGiaoDich', 'moTa'],
        properties: {
          loai: { type: 'STRING' },
          danhMuc: { type: 'STRING' },
          soTien: { type: 'INTEGER' },
          ngayGiaoDich: { type: 'STRING' },
          moTa: { type: 'STRING' },
          ghiChu: { type: 'STRING' },
        },
      },
    };
  }
  return {
    prompt: [
      'Hãy đọc ảnh thời khóa biểu / lịch học đại học này và trích xuất danh sách các buổi học thành JSON.',
      'Quy tắc:',
      '- thu: số nguyên từ 2 đến 8 (2=Thứ 2, 3=Thứ 3, ..., 7=Thứ 7, 8=Chủ nhật).',
      '- gioBatDau, gioKetThuc: định dạng 24h HH:mm (ví dụ "07:00", "13:00", "17:15"). Nếu ảnh chỉ ghi Tiết mà có khung giờ chuẩn thì quy đổi; nếu thấy rõ giờ bắt đầu/kết thúc hãy dùng đúng giờ trong ảnh.',
      '- tenMon: tên môn học tiếng Việt đầy đủ chính xác dấu (không gộp mã lớp hay ghi chú tạm ngưng vào tên môn).',
      '- phongHoc: mã phòng và mô tả ngắn nếu có (ví dụ "I7-03 (học đường)", "B2-04 (Phòng máy)").',
      '- giangVien: học hàm/học vị + họ tên giảng viên đầy đủ (ví dụ "ThS. Trương Thanh Thảo").',
    ].join('\n'),
    schema: {
      type: 'OBJECT',
      required: ['rows'],
      properties: {
        rows: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            required: ['tenMon', 'thu', 'gioBatDau', 'gioKetThuc', 'phongHoc', 'giangVien'],
            properties: {
              tenMon: { type: 'STRING' },
              thu: { type: 'INTEGER' },
              gioBatDau: { type: 'STRING' },
              gioKetThuc: { type: 'STRING' },
              phongHoc: { type: 'STRING' },
              giangVien: { type: 'STRING' },
            },
          },
        },
      },
    },
  };
}

async function extractWithVisionAI(body, deps = {}) {
  const config = (deps.getAiConfig || cauHinhAI)();
  if (!config.sanSang) {
    throw visionError(503, 'OCR_AI_NOT_CONFIGURED', 'Quét ảnh bằng AI Vision chưa được bật trên máy chủ. Hệ thống vẫn hỗ trợ quét trực tiếp trên thiết bị.');
  }
  const { kind, mimeType, base64Data } = parseVisionInput(body);
  const { prompt, schema } = buildVisionRequest(kind);
  const generationConfig = {
    temperature: 0.1,
    maxOutputTokens: kind === 'receipt' ? 500 : 2048,
    responseMimeType: 'application/json',
    responseSchema: schema,
  };
  if (config.model === 'gemini-3.5-flash-lite') {
    generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL', includeThoughts: false };
  }

  try {
    dns.setDefaultResultOrder('ipv4first');
    const fetchImpl = deps.fetchImpl || fetch;
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.key },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          }],
          generationConfig,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) throw visionError(429, 'OCR_AI_QUOTA', 'AI Vision đang hết hạn mức hoặc quá tải. Bạn vui lòng thử lại sau hoặc chỉnh tay.');
      if ([400, 401, 403, 404].includes(response.status)) throw visionError(503, 'OCR_AI_CONFIGURATION', 'Chưa gọi được AI Vision. Cần kiểm tra khóa Gemini API trên máy chủ.');
      throw visionError(502, 'OCR_AI_PROVIDER', 'Dịch vụ AI Vision đang bận. Bạn hãy thử lại sau.');
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('').trim();
    if (data?.promptFeedback?.blockReason || !textPart) {
      throw visionError(422, 'OCR_AI_NO_ANSWER', 'AI Vision chưa trích xuất được nội dung từ ảnh này. Thử chụp rõ nét hơn.');
    }
    let parsed;
    try {
      parsed = JSON.parse(textPart);
    } catch {
      throw visionError(422, 'OCR_AI_INVALID_JSON', 'Phản hồi AI không đúng định dạng dữ liệu. Hãy thử quét lại.');
    }
    return kind === 'receipt' ? normalizeReceiptAi(parsed, config.model) : normalizeTimetableAi(parsed, config.model);
  } catch (error) {
    if (typeof error.code === 'string' && error.code.startsWith('OCR_AI_')) throw error;
    if (['TimeoutError', 'AbortError'].includes(error.name)) {
      throw visionError(504, 'OCR_AI_TIMEOUT', 'AI Vision phản hồi quá lâu. Bạn hãy thử lại hoặc dùng ảnh dung lượng nhỏ hơn.');
    }
    throw visionError(502, 'OCR_AI_PROVIDER', 'Chưa kết nối được dịch vụ AI Vision. Hãy thử lại sau.');
  }
}

module.exports = {
  parseVisionInput,
  normalizeReceiptAi,
  normalizeTimetableAi,
  extractWithVisionAI,
};
