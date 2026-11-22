const crypto = require('node:crypto');
const dns = require('node:dns');
const { CHATBOT } = require('../../constants');
const { cauHinhAI } = require('./gemini.service');
const { dateKey, plusDays } = require('../thoikhoabieu/adjustments.service');
const { vietnamParts } = require('../../utils/date.util');
const { validDong } = require('../../utils/money.util');

const ALLOWED_TOOLS = ['create_transaction', 'create_deadline', 'create_class_session', 'set_budget'];

const TOOL_LABELS = {
  create_transaction: 'Ghi nhận giao dịch tài chính',
  create_deadline: 'Tạo công việc / Deadline',
  create_class_session: 'Thêm buổi học vào Thời khóa biểu',
  set_budget: 'Thiết lập ngân sách tháng',
};

const CHI_CATEGORIES = ['an_uong', 'di_lai', 'tro', 'hoc_phi', 'giai_tri', 'khac'];
const THU_CATEGORIES = ['luong', 'hoc_bong', 'tro_cap', 'thuong', 'khac'];

const TOOL_DECLARATIONS = [
  {
    name: 'create_transaction',
    description: 'Tạo một giao dịch thu hoặc chi tài chính mới khi người dùng yêu cầu ghi/thêm khoản chi, mua sắm, ăn uống, hoặc khoản thu.',
    parameters: {
      type: 'OBJECT',
      required: ['loai', 'soTien', 'danhMuc', 'moTa', 'ngayGiaoDich'],
      properties: {
        loai: { type: 'STRING', enum: ['chi', 'thu'], description: 'Loại giao dịch: chi hoặc thu' },
        soTien: { type: 'INTEGER', description: 'Số tiền tính bằng VNĐ (số nguyên dương)' },
        danhMuc: { type: 'STRING', description: 'Mã danh mục: chi dùng an_uong|di_lai|tro|hoc_phi|giai_tri|khac; thu dùng luong|hoc_bong|tro_cap|thuong|khac' },
        moTa: { type: 'STRING', description: 'Mô tả ngắn gọn nội dung giao dịch' },
        ngayGiaoDich: { type: 'STRING', description: 'Ngày giao dịch định dạng YYYY-MM-DD theo múi giờ Việt Nam' },
      },
    },
  },
  {
    name: 'create_deadline',
    description: 'Tạo một công việc hoặc deadline mới cho sinh viên.',
    parameters: {
      type: 'OBJECT',
      required: ['tieuDe', 'hanChot', 'doUuTien'],
      properties: {
        tieuDe: { type: 'STRING', description: 'Tên công việc hoặc bài tập cần hoàn thành' },
        hanChot: { type: 'STRING', description: 'Ngày hoặc ngày giờ hạn chót: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm' },
        doUuTien: { type: 'STRING', enum: ['thap', 'binh_thuong', 'cao'], description: 'Mức độ ưu tiên' },
      },
    },
  },
  {
    name: 'create_class_session',
    description: 'Thêm một buổi học mới vào thời khóa biểu hằng tuần.',
    parameters: {
      type: 'OBJECT',
      required: ['tenMon', 'thu', 'gioBatDau', 'gioKetThuc'],
      properties: {
        tenMon: { type: 'STRING', description: 'Tên môn học' },
        thu: { type: 'INTEGER', description: 'Thứ trong tuần từ 2 (Thứ 2) đến 8 (Chủ nhật)' },
        gioBatDau: { type: 'STRING', description: 'Giờ bắt đầu định dạng HH:MM (24h)' },
        gioKetThuc: { type: 'STRING', description: 'Giờ kết thúc định dạng HH:MM (24h)' },
        phongHoc: { type: 'STRING', description: 'Phòng học (nếu có)' },
        giangVien: { type: 'STRING', description: 'Tên giảng viên (nếu có)' },
      },
    },
  },
  {
    name: 'set_budget',
    description: 'Đặt hạn mức ngân sách chi tiêu cho một danh mục trong tháng.',
    parameters: {
      type: 'OBJECT',
      required: ['danhMuc', 'soTienToiDa', 'thang', 'nam'],
      properties: {
        danhMuc: { type: 'STRING', description: 'Mã danh mục chi: an_uong|di_lai|tro|hoc_phi|giai_tri|khac' },
        soTienToiDa: { type: 'INTEGER', description: 'Hạn mức tối đa tính bằng VNĐ' },
        thang: { type: 'INTEGER', description: 'Tháng từ 1 đến 12' },
        nam: { type: 'INTEGER', description: 'Năm gồm 4 chữ số' },
      },
    },
  },
];

function foldText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stripDatesAndTimesForMoney(folded) {
  return folded
    .replace(/\bnam\s+\d{4}\b/g, ' ')
    .replace(/\bthang\s+(?:1[0-2]|0?[1-9])(?:\s*\/\s*\d{4})?\b/g, ' ')
    .replace(/\bt\s*(?:1[0-2]|0?[1-9])\b/g, ' ')
    .replace(/\bngay\s+\d{1,2}\b/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, ' ')
    .replace(/\b\d{1,2}\s*(?:h|gio|:)\s*\d{0,2}\b/g, ' ')
    .replace(/\b(?:thu\s*[2-8]|cn)\b/g, ' ');
}

const WORD_DIGITS = {
  khong: 0, linh: 0, le: 0,
  mot: 1, mod: 1,
  hai: 2,
  ba: 3,
  bon: 4, tu: 4,
  nam: 5, lam: 5, nham: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
};

function parseUnderThousandWords(tokens) {
  if (!tokens.length) return null;
  let value = 0;
  let hasDigit = false;
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'tram') {
      const base = hasDigit && value < 10 ? value : 1;
      value = base * 100;
      hasDigit = true;
      i++;
      continue;
    }
    if (t === 'muoi' || t === 'chuc') {
      if (tokens[i - 1] === 'muoi') {
        i++;
        continue;
      }
      if (hasDigit && value > 0 && value < 10) {
        value = value * 10;
      } else {
        const hundreds = Math.floor(value / 100) * 100;
        const rem = value % 100;
        value = hundreds + (rem > 0 ? rem * 10 : 10);
      }
      hasDigit = true;
      i++;
      continue;
    }
    if (t === 'linh' || t === 'le') {
      i++;
      continue;
    }
    if (Object.hasOwn(WORD_DIGITS, t)) {
      const d = WORD_DIGITS[t];
      if (!hasDigit) {
        value = d;
        hasDigit = true;
      } else if (tokens[i - 1] === 'tram' || tokens[i - 1] === 'linh' || tokens[i - 1] === 'le' || tokens[i - 1] === 'muoi' || tokens[i - 1] === 'chuc') {
        value += d;
      } else if (value === 10 && i > 0) {
        value += d;
      } else {
        value = value * 10 + d;
      }
      i++;
      continue;
    }
    return null;
  }

  return hasDigit ? value : null;
}

function parseSpokenVietnameseMoney(folded) {
  const numWordSet = new Set([
    ...Object.keys(WORD_DIGITS),
    'muoi', 'chuc', 'tram', 'ruoi', 'nghin', 'ngan', 'trieu',
  ]);
  const tokens = folded.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  for (let start = 0; start < tokens.length; start++) {
    if (!numWordSet.has(tokens[start]) || tokens[start] === 'ruoi') continue;
    let end = start;
    while (end < tokens.length && numWordSet.has(tokens[end])) end++;
    const slice = tokens.slice(start, end);
    if (!slice.some((t) => t === 'trieu' || t === 'nghin' || t === 'ngan')) {
      start = end - 1;
      continue;
    }

    let total = 0;
    let segment = [];
    let lastUnit = 0;

    for (let k = 0; k < slice.length; k++) {
      const tok = slice[k];
      if (tok === 'trieu') {
        const prefix = segment.length ? parseUnderThousandWords(segment) : 1;
        if (prefix === null) { total = 0; break; }
        total += prefix * 1_000_000;
        segment = [];
        lastUnit = 1_000_000;
      } else if (tok === 'nghin' || tok === 'ngan') {
        const prefix = segment.length ? parseUnderThousandWords(segment) : 1;
        if (prefix === null) { total = 0; break; }
        total += prefix * 1_000;
        segment = [];
        lastUnit = 1_000;
      } else if (tok === 'ruoi') {
        if (lastUnit > 0) {
          total += Math.round(lastUnit * 0.5);
          lastUnit = 0;
        }
      } else {
        segment.push(tok);
      }
    }

    if (total > 0) {
      if (segment.length) {
        const rem = parseUnderThousandWords(segment);
        if (rem !== null) {
          if (lastUnit === 1_000_000 && rem < 10) total += rem * 100_000;
          else if (lastUnit === 1_000 && rem < 10) total += rem * 100;
          else total += rem;
        }
      }
      const rounded = Math.round(total);
      if (validDong(rounded)) return rounded;
    }

    start = end - 1;
  }

  return null;
}

function parseVietnameseMoney(text) {
  const folded = stripDatesAndTimesForMoney(foldText(text));
  if (!folded) return null;

  // 1. Compound millions: 2tr5, 2 trieu 500 nghin, 2 trieu 5, 2 trieu ruoi
  const compoundTr = /\b(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|cu)\s*(?:(\d{1,3})\s*(?:k|nghin|ngan)?|(ruoi))?\b/.exec(folded);
  if (compoundTr) {
    const whole = Number(compoundTr[1].replace(',', '.'));
    if (Number.isFinite(whole) && whole > 0) {
      let extra = 0;
      if (compoundTr[3] === 'ruoi') {
        extra = 500_000;
      } else if (compoundTr[2]) {
        const dStr = compoundTr[2];
        if (dStr.length === 1) extra = Number(dStr) * 100_000;
        else if (dStr.length === 2) extra = Number(dStr) * 10_000;
        else extra = Number(dStr) * 1_000;
      }
      const amount = Math.round(whole * 1_000_000 + extra);
      if (validDong(amount)) return amount;
    }
  }

  // 2. Thousands: 45k, 45.5k, 45 nghìn, 45 ngàn
  const thousandMatch = /\b(\d+(?:[.,]\d+)?)\s*(?:k|nghin|ngan)\b/.exec(folded);
  if (thousandMatch) {
    const num = Number(thousandMatch[1].replace(',', '.'));
    if (Number.isFinite(num) && num > 0) {
      const amount = Math.round(num * 1_000);
      if (validDong(amount)) return amount;
    }
  }

  // 3. Spoken Vietnamese numbers (e.g. "bốn mươi lăm nghìn", "một triệu rưỡi")
  const spoken = parseSpokenVietnameseMoney(folded);
  if (spoken) return spoken;

  // 4. Explicit grouped digits or currency suffix: 120.000đ, 120,000 vnd, 50000 đồng, 50000d
  const formattedMatch = /\b(\d{1,3}(?:[.,]\d{3})+|\d{3,})(?:\s*(?:vnd|dong|d)\b)/.exec(folded)
    || /\b(\d{1,3}(?:[.,]\d{3})+)\b/.exec(folded);
  if (formattedMatch) {
    const amount = Number(formattedMatch[1].replace(/[.,]/g, ''));
    if (validDong(amount)) return amount;
  }

  // 5. Standalone bare integer >= 1000 (excluding bare 4-digit year range 1900..2099 without currency marker)
  const bareMatch = /\b(\d{4,12})\b/.exec(folded);
  if (bareMatch) {
    const amount = Number(bareMatch[1]);
    if (amount >= 1900 && amount <= 2099) return null;
    if (validDong(amount)) return amount;
  }

  return null;
}

function validCalendarDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseTimeToken(rawHour, rawMin, meridiem) {
  let hour = Number(rawHour);
  const minute = rawMin === undefined || rawMin === '' ? 0 : Number(rawMin);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const m = meridiem ? foldText(meridiem) : '';
  if ((m === 'chieu' || m === 'toi' || m === 'dem' || m === 'pm') && hour < 12) {
    hour += 12;
  } else if ((m === 'sang' || m === 'am') && hour === 12) {
    hour = 0;
  }
  if (hour > 23) return null;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function parseVietnameseDateAndTime(text, now = new Date()) {
  const folded = foldText(text);
  const today = dateKey(now);
  const parts = vietnamParts(now); // weekday 1..7 -> LifeHub thu = weekday + 1 (2..8)
  const currentThu = parts.weekday + 1;

  let date = today;
  let explicitDateFound = false;

  const isoMatch = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(folded);
  const slashMatch = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(folded);

  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    if (validCalendarDate(y, m, d)) {
      date = `${y}-${pad2(m)}-${pad2(d)}`;
      explicitDateFound = true;
    }
  } else if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    let year = slashMatch[3] ? Number(slashMatch[3]) : parts.year;
    if (year < 100) year += 2000;
    if (validCalendarDate(year, month, day)) {
      date = `${year}-${pad2(month)}-${pad2(day)}`;
      explicitDateFound = true;
    }
  } else if (/\bhom qua\b/.test(folded)) {
    date = plusDays(today, -1);
    explicitDateFound = true;
  } else if (/\bhom nay\b/.test(folded)) {
    date = today;
    explicitDateFound = true;
  } else if (/\b(?:ngay\s+mai|sang\s+mai|chieu\s+mai|toi\s+mai|mai)\b/.test(folded)) {
    date = plusDays(today, 1);
    explicitDateFound = true;
  } else if (/\b(?:ngay\s+kia|ngay\s+mot)\b/.test(folded)) {
    date = plusDays(today, 2);
    explicitDateFound = true;
  }

  let weekday = null;
  const weekdayMatch = /\b(?:thu\s*(2|3|4|5|6|7|hai|ba|tu|bon|nam|sau|bay)|(chu\s*nhat|cn))\b/.exec(folded);
  if (weekdayMatch) {
    if (weekdayMatch[2]) {
      weekday = 8;
    } else {
      const wordMap = { '2': 2, hai: 2, '3': 3, ba: 3, '4': 4, tu: 4, bon: 4, '5': 5, nam: 5, '6': 6, sau: 6, '7': 7, bay: 7 };
      weekday = wordMap[weekdayMatch[1]] || null;
    }
    if (!explicitDateFound && weekday) {
      let delta = weekday - currentThu;
      if (delta < 0) delta += 7;
      if (/\btuan sau\b/.test(folded) && delta < 7) delta += 7;
      date = plusDays(today, delta);
    }
  } else if (!explicitDateFound && /\btuan sau\b/.test(folded)) {
    date = plusDays(today, 7);
  }

  // Time range (for timetable class sessions) or single time (for deadlines)
  let time = null;
  let endTime = null;
  const rangeMatch = /\b(\d{1,2})\s*(?:h|gio|:)\s*(\d{1,2})?\s*(sang|trua|chieu|toi|dem|am|pm)?\s*(?:-|den|toi)\s*(\d{1,2})\s*(?:h|gio|:)?\s*(\d{1,2})?\s*(sang|trua|chieu|toi|dem|am|pm)?\b/.exec(folded);
  if (rangeMatch) {
    const startMer = rangeMatch[3] || '';
    const endMer = rangeMatch[6] || startMer;
    time = parseTimeToken(rangeMatch[1], rangeMatch[2], startMer);
    endTime = parseTimeToken(rangeMatch[4], rangeMatch[5], endMer);
  } else {
    const singleTimeMatch = /\b(\d{1,2})\s*(?:h|gio|:)\s*(\d{1,2})?\s*(sang|trua|chieu|toi|dem|am|pm)?\b/.exec(folded);
    if (singleTimeMatch && (singleTimeMatch[0].includes('h') || singleTimeMatch[0].includes('gio') || singleTimeMatch[0].includes(':') || singleTimeMatch[3])) {
      time = parseTimeToken(singleTimeMatch[1], singleTimeMatch[2], singleTimeMatch[3]);
    }
  }

  return { date, time, endTime, weekday };
}

function isActionCommandIntent(text) {
  if (typeof text !== 'string') return false;
  const q = foldText(text);
  if (!q || q.length > 500) return false;

  const hasNegativeQuery = /\b(?:bao nhieu|may |tom tat|xem |kiem tra|tra cuu|liet ke|lam sao|cach |huong dan|nhu the nao|tai sao|vi sao|ke hoach|tu van|goi y|quy dinh|quy che|gpa|diem trung binh|hom qua hoc gi|hom nay hoc gi|tinh hinh)\b/.test(q);
  if (hasNegativeQuery) return false;

  const hasExplicitWriteVerb = /\b(?:ghi|them|nhap|tao|dat|nhac|luu)\b/.test(q);
  if (q.endsWith('?') && !hasExplicitWriteVerb) return false;

  // 1. Set budget
  if (/\b(?:dat|tao|cai|gioi han|them)\s+(?:giup\s+|cho\s+|toi\s+|minh\s+)?(?:ngan sach|han muc)\b/.test(q)) {
    return true;
  }

  // 2. Create class session
  if (/\b(?:them|tao|xep|luu|ghi)\s+(?:giup\s+|cho\s+|toi\s+|minh\s+)?(?:lich hoc|buoi hoc|mon hoc vao tkb|thoi khoa bieu)\b/.test(q)) {
    return true;
  }

  // 3. Create deadline
  if (/\b(?:tao|them|dat|luu|ghi)\s+(?:giup\s+|cho\s+|toi\s+|minh\s+)?(?:deadline|han chot|cong viec|viec can lam|lich nop|nhac nho)\b/.test(q)) {
    return true;
  }
  if (/\bnhac\s+(?:toi|minh)\s+\S+/.test(q)) {
    return true;
  }

  // 4. Create transaction (explicit command OR finance verb + parseable amount)
  if (/\b(?:ghi|them|nhap|luu|tao)\s+(?:giup\s+|cho\s+|toi\s+|minh\s+)?(?:khoan\s+)?(?:chi|thu|giao dich|chi tieu|thu nhap)\b/.test(q)) {
    return true;
  }

  const hasMoneyVerb = /\b(?:ghi|them|nhap|chi|tieu|mua|an|uong|do xang|tra tien|dong tien|nhan|thu)\b/.test(q);
  if (hasMoneyVerb && parseVietnameseMoney(text) !== null) {
    return true;
  }

  return false;
}

function guessFinanceCategory(text, loai) {
  const f = foldText(text).replace(/\b(?:ngan sach|han muc)\b/g, ' ');
  if (loai === 'thu') {
    if (/\b(?:luong|lam them|part ?time|thuc tap|gia su|freelance|tien cong)\b/.test(f)) return 'luong';
    if (/\b(?:hoc bong|tai tro|scholarship)\b/.test(f)) return 'hoc_bong';
    if (/\b(?:tro cap|ba me|bo me|gia dinh|me gui|bo gui)\b/.test(f)) return 'tro_cap';
    if (/\b(?:thuong|li xi|hoan tien|cashback|giai thuong)\b/.test(f)) return 'thuong';
    return 'khac';
  }
  if (/\b(?:do xang|xang|grab|be|gojek|xanh sm|xe buyt|bus|gui xe|taxi|sua xe|ve xe|ve tau)\b/.test(f)) return 'di_lai';
  if (/\b(?:nha tro|phong tro|tien nha|tien dien|tien nuoc|tro|internet|wifi|chung cu)\b/.test(f)) return 'tro';
  if (/\b(?:hoc phi|giao trinh|mua sach|sach vo|photo|in an|toeic|ielts|khoa hoc|but|vo)\b/.test(f)) return 'hoc_phi';
  if (/\b(?:xem phim|phim|cgv|lotte|game|netflix|spotify|du lich|gym|concert|karaoke)\b/.test(f)) return 'giai_tri';
  if (/\b(?:an|an uong|an sang|an trua|an toi|uong|com|pho|bun|tra sua|ca phe|cafe|banh|lau|nuong|pizza|highland|sieu thi|do an)\b/.test(f)) return 'an_uong';
  return 'khac';
}

function cleanTransactionDescription(text) {
  let out = String(text || '').trim();
  out = out.replace(/^(?:hãy\s+)?(?:ghi|thêm|nhập|lưu|tạo)\s+(?:giúp\s+|cho\s+|tôi\s+|mình\s+)?(?:khoản\s+)?(?:chi\s*tiêu|thu\s*nhập|giao\s*dịch|chi|thu)?\s*/i, '');
  out = out.replace(/\b\d+(?:[.,]\d+)?\s*(?:tr|triệu|trieu|củ|cu|k|nghìn|nghin|ngàn|ngan|đồng|dong|vnd|đ|d)\b\s*(?:\d{1,3})?/gi, ' ');
  out = out.replace(/\b\d{1,3}(?:[.,]\d{3})+\b/g, ' ');
  out = out.replace(/\b(?:hôm qua|hôm nay|ngày mai|ngày kia|hiện tại)\b/gi, ' ');
  out = out.replace(/^(?:để|với|tiền|khoản|mua|vào|cho|ngày)\s+/i, '');
  out = out.replace(/\s+/g, ' ').replace(/^[,\-.\s]+|[,\-.\s]+$/g, '').trim();
  if (!out) return 'Giao dịch mới';
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function cleanDeadlineTitle(text) {
  let out = String(text || '').trim();
  out = out.replace(/^(?:hãy\s+)?(?:tạo|thêm|đặt|lưu|ghi|nhắc)\s+(?:giúp\s+|cho\s+|tôi\s+|mình\s+)?(?:cái\s+)?(?:deadline|hạn chót|công việc|việc cần làm|lịch nộp|nhắc nhở)?\s*/i, '');
  out = out.replace(/\b(?:độ\s+)?ưu tiên\s+(?:cao|thấp|bình thường|khẩn cấp)\b/gi, ' ');
  out = out.replace(/\b(?:mức\s+)?(?:khẩn cấp|quan trọng|gấp|không gấp)\b/gi, ' ');
  out = out.replace(/\b(?:vào\s+|trước\s+|hạn\s+)?(?:lúc\s+)?\d{1,2}\s*(?:h|giờ|:)\s*\d{0,2}\s*(?:sáng|trưa|chiều|tối|am|pm)?\b/gi, ' ');
  out = out.replace(/\b(?:vào\s+|trước\s+|hạn\s+)?(?:hôm nay|hôm qua|ngày mai|ngày kia|tuần sau|thứ\s*[2-7]|chủ nhật)\b/gi, ' ');
  out = out.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/g, ' ');
  out = out.replace(/\s+/g, ' ').replace(/^[,\-.\s]+|[,\-.\s]+$/g, '').trim();
  return (out || 'Công việc mới').slice(0, 200);
}

function addTwoHours(startTime) {
  const [hh, mm] = startTime.split(':').map(Number);
  const endTotal = Math.min(23 * 60 + 55, hh * 60 + mm + 120);
  return `${pad2(Math.floor(endTotal / 60))}:${pad2(endTotal % 60)}`;
}

function sanitizeToolProposal(toolName, rawArgs = {}, sourceText = '', now = new Date(), engine = 'local-agent-parser') {
  if (!ALLOWED_TOOLS.includes(toolName)) return null;

  const today = dateKey(now);
  const parts = vietnamParts(now);
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};
  const missingFields = [];

  if (toolName === 'create_transaction') {
    const loai = args.loai === 'thu' ? 'thu' : 'chi';
    const rawAmount = Number(args.soTien);
    const soTien = validDong(rawAmount) ? rawAmount : null;
    if (!soTien) missingFields.push('soTien');

    const allowedCats = loai === 'thu' ? THU_CATEGORIES : CHI_CATEGORIES;
    const danhMuc = allowedCats.includes(args.danhMuc)
      ? args.danhMuc
      : guessFinanceCategory(`${args.moTa || ''} ${sourceText}`, loai);

    const moTa = typeof args.moTa === 'string' && args.moTa.trim()
      ? args.moTa.trim().slice(0, 500)
      : cleanTransactionDescription(sourceText);

    const dateStr = typeof args.ngayGiaoDich === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.ngayGiaoDich.trim())
      ? args.ngayGiaoDich.trim()
      : today;

    const params = {
      loai,
      soTien: soTien || '',
      danhMuc,
      moTa,
      ngayGiaoDich: dateStr,
    };

    const loaiLabel = loai === 'thu' ? 'Thu' : 'Chi';
    const amountLabel = soTien ? `${soTien.toLocaleString('vi-VN')}đ` : 'chưa rõ số tiền';
    const summary = `${loaiLabel} ${amountLabel} · ${moTa} (${dateStr})`;

    return {
      tool: toolName,
      label: TOOL_LABELS[toolName],
      engine,
      params,
      summary,
      missingFields,
    };
  }

  if (toolName === 'create_deadline') {
    const tieuDe = typeof args.tieuDe === 'string' && args.tieuDe.trim()
      ? args.tieuDe.trim().slice(0, 200)
      : cleanDeadlineTitle(sourceText);
    if (!tieuDe) missingFields.push('tieuDe');

    let hanChot = today;
    if (typeof args.hanChot === 'string' && /^\d{4}-\d{2}-\d{2}(?:T[0-2]\d:[0-5]\d)?$/.test(args.hanChot.trim())) {
      hanChot = args.hanChot.trim();
    }

    const doUuTien = ['thap', 'binh_thuong', 'cao'].includes(args.doUuTien) ? args.doUuTien : 'binh_thuong';
    const params = { tieuDe, hanChot, doUuTien };
    const priorityText = doUuTien === 'cao' ? 'Khẩn cấp' : doUuTien === 'thap' ? 'Thấp' : 'Bình thường';

    return {
      tool: toolName,
      label: TOOL_LABELS[toolName],
      engine,
      params,
      summary: `${tieuDe} · Hạn: ${hanChot.replace('T', ' ')} · Ưu tiên: ${priorityText}`,
      missingFields,
    };
  }

  if (toolName === 'create_class_session') {
    const tenMon = typeof args.tenMon === 'string' && args.tenMon.trim()
      ? args.tenMon.trim().slice(0, 200)
      : 'Buổi học mới';

    const thuNum = Number(args.thu);
    const thu = Number.isInteger(thuNum) && thuNum >= 2 && thuNum <= 8 ? thuNum : 2;

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const gioBatDau = typeof args.gioBatDau === 'string' && timeRegex.test(args.gioBatDau.trim())
      ? args.gioBatDau.trim()
      : '07:00';
    let gioKetThuc = typeof args.gioKetThuc === 'string' && timeRegex.test(args.gioKetThuc.trim())
      ? args.gioKetThuc.trim()
      : addTwoHours(gioBatDau);
    if (gioKetThuc <= gioBatDau) {
      gioKetThuc = addTwoHours(gioBatDau);
    }

    const phongHoc = typeof args.phongHoc === 'string' ? args.phongHoc.trim().slice(0, 50) : '';
    const giangVien = typeof args.giangVien === 'string' ? args.giangVien.trim().slice(0, 100) : '';

    const params = { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien };
    const thuLabel = thu === 8 ? 'Chủ nhật' : `Thứ ${thu}`;

    return {
      tool: toolName,
      label: TOOL_LABELS[toolName],
      engine,
      params,
      summary: `${tenMon} · ${thuLabel} (${gioBatDau}–${gioKetThuc})${phongHoc ? ` · Phòng ${phongHoc}` : ''}`,
      missingFields,
    };
  }

  // set_budget
  const danhMuc = CHI_CATEGORIES.includes(args.danhMuc)
    ? args.danhMuc
    : guessFinanceCategory(sourceText, 'chi');
  const rawLimit = Number(args.soTienToiDa);
  const soTienToiDa = validDong(rawLimit) ? rawLimit : null;
  if (!soTienToiDa) missingFields.push('soTienToiDa');

  const thangNum = Number(args.thang);
  const namNum = Number(args.nam);
  const thang = Number.isInteger(thangNum) && thangNum >= 1 && thangNum <= 12 ? thangNum : parts.month;
  const nam = Number.isInteger(namNum) && namNum >= 1000 && namNum <= 9999 ? namNum : parts.year;

  const params = { danhMuc, soTienToiDa: soTienToiDa || '', thang, nam };
  const limitLabel = soTienToiDa ? `${soTienToiDa.toLocaleString('vi-VN')}đ` : 'chưa rõ hạn mức';

  return {
    tool: toolName,
    label: TOOL_LABELS[toolName],
    engine,
    params,
    summary: `Ngân sách ${danhMuc} tháng ${thang}/${nam}: ${limitLabel}`,
    missingFields,
  };
}

function heuristicParseAgentAction(text, now = new Date()) {
  const f = foldText(text);
  const parts = vietnamParts(now);
  const dt = parseVietnameseDateAndTime(text, now);
  const amount = parseVietnameseMoney(text);

  // 1. Set budget
  if (/\b(?:ngan sach|han muc)\b/.test(f) && /\b(?:dat|tao|cai|gioi han|them)\b/.test(f)) {
    const monthMatch = /\bthang\s*(1[0-2]|0?[1-9])\b/.exec(f);
    const yearMatch = /\bnam\s*(\d{4})\b/.exec(f);
    const thang = monthMatch ? Number(monthMatch[1]) : parts.month;
    const nam = yearMatch ? Number(yearMatch[1]) : parts.year;
    return sanitizeToolProposal('set_budget', {
      danhMuc: guessFinanceCategory(text, 'chi'),
      soTienToiDa: amount,
      thang,
      nam,
    }, text, now, 'local-agent-parser');
  }

  // 2. Class session
  if (/\b(?:lich hoc|buoi hoc|mon hoc vao tkb|thoi khoa bieu)\b/.test(f) && /\b(?:them|tao|xep|luu|ghi)\b/.test(f)) {
    const roomMatch = /\bph[òo]ng\s+([A-Za-z0-9._-]+)\b/i.exec(text);
    const phongHoc = roomMatch ? roomMatch[1].trim() : '';
    let tenMon = String(text || '').trim()
      .replace(/^(?:hãy\s+)?(?:thêm|tạo|xếp|lưu|ghi)\s+(?:giúp\s+|cho\s+|tôi\s+|mình\s+)?(?:lịch học|buổi học|môn học|vào tkb|thời khóa biểu)*\s*/i, '')
      .replace(/\b(?:môn\s+)/i, '')
      .replace(/\b(?:vào\s+)?(?:thứ\s*[2-7]|thứ\s*(?:hai|ba|tư|bốn|năm|sáu|bảy)|chủ\s*nhật|cn)\b/gi, ' ')
      .replace(/\b(?:từ\s*)?\d{1,2}\s*(?:h|giờ|:)\s*\d{0,2}\s*(?:sáng|trưa|chiều|tối|am|pm)?\s*(?:-|đến|tới)\s*\d{1,2}\s*(?:h|giờ|:)?\s*\d{0,2}\s*(?:sáng|trưa|chiều|tối|am|pm)?\b/gi, ' ')
      .replace(/\bph[òo]ng\s+[A-Za-z0-9._-]+\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[,\-.\s]+|[,\-.\s]+$/g, '')
      .trim();

    if (!tenMon) tenMon = 'Buổi học mới';
    const gioBatDau = dt.time || '07:00';
    const gioKetThuc = dt.endTime && dt.endTime > gioBatDau ? dt.endTime : addTwoHours(gioBatDau);

    return sanitizeToolProposal('create_class_session', {
      tenMon,
      thu: dt.weekday || 2,
      gioBatDau,
      gioKetThuc,
      phongHoc,
      giangVien: '',
    }, text, now, 'local-agent-parser');
  }

  // 3. Deadline
  if (/\b(?:deadline|han chot|cong viec|viec can lam|lich nop|nhac nho)\b/.test(f) || /\bnhac\s+(?:toi|minh)\s+\S+/.test(f)) {
    let doUuTien = 'binh_thuong';
    if (/\b(?:uu tien cao|khan cap|khan|gap|quan trong|thi|do an|bao ve)\b/.test(f)) doUuTien = 'cao';
    else if (/\b(?:uu tien thap|khong gap|thong tha)\b/.test(f)) doUuTien = 'thap';

    const hanChot = dt.time ? `${dt.date}T${dt.time}` : dt.date;
    return sanitizeToolProposal('create_deadline', {
      tieuDe: cleanDeadlineTitle(text),
      hanChot,
      doUuTien,
    }, text, now, 'local-agent-parser');
  }

  // 4. Finance transaction
  const isThu = /\b(?:ghi\s+thu|them\s+thu|khoan\s+thu|thu\s+nhap|nhan\s+luong|nhan\s+tien|hoc\s+bong|tro\s+cap|tien\s+thuong|duoc\s+cho|ban\s+do)\b/.test(f);
  const loai = isThu ? 'thu' : 'chi';
  const moTa = cleanTransactionDescription(text);
  return sanitizeToolProposal('create_transaction', {
    loai,
    soTien: amount,
    danhMuc: guessFinanceCategory(text, loai),
    moTa,
    ngayGiaoDich: dt.date,
  }, text, now, 'local-agent-parser');
}

async function callGeminiAgentTool({ tinNhan, now = new Date() }) {
  const config = cauHinhAI();
  if (!config.sanSang) return null;

  const today = dateKey(now);
  const parts = vietnamParts(now);
  const currentThu = parts.weekday + 1;

  const systemInstruction = [
    'Bạn là AI Agent điều phối công cụ (Tool-Calling) cho ứng dụng sinh viên LifeHub.',
    `Thời gian hiện tại (Việt Nam Asia/Ho_Chi_Minh): ngày ${today}, thứ ${currentThu === 8 ? 'Chủ nhật (8)' : currentThu}, tháng ${parts.month}/${parts.year}.`,
    'Hãy phân tích yêu cầu của sinh viên và gọi đúng MỘT công cụ phù hợp nhất kèm tham số chính xác.',
    'Quy đổi số tiền tiếng Việt (45k = 45000, 1.5tr = 1500000, 2 triệu rưỡi = 2500000).',
    'Thứ trong tuần dùng số nguyên: Thứ 2=2, Thứ 3=3, ..., Thứ 7=7, Chủ nhật=8.',
  ].join('\n');

  const generationConfig = { temperature: 0.1, maxOutputTokens: 512 };
  if (config.model === 'gemini-3.5-flash-lite') {
    generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL', includeThoughts: false };
  }

  dns.setDefaultResultOrder('ipv4first');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(CHATBOT.TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: tinNhan }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: {
        functionCallingConfig: {
          mode: 'ANY',
          allowedFunctionNames: ALLOWED_TOOLS,
        },
      },
      generationConfig,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const resParts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(resParts)) return null;
  const fc = resParts.find((p) => p?.functionCall)?.functionCall;
  if (!fc?.name || !ALLOWED_TOOLS.includes(fc.name)) return null;

  return sanitizeToolProposal(fc.name, fc.args, tinNhan, now, 'gemini-function-calling');
}

async function proposeAgentAction({ tinNhan, dungAI = false, dongYGuiAI = false, now = new Date() }) {
  if (!isActionCommandIntent(tinNhan)) return null;

  let proposal = null;
  if (dungAI === true && dongYGuiAI === true && cauHinhAI().sanSang) {
    try {
      proposal = await callGeminiAgentTool({ tinNhan, now });
    } catch {
      proposal = null;
    }
  }

  if (!proposal) {
    proposal = heuristicParseAgentAction(tinNhan, now);
  }
  if (!proposal) return null;

  return {
    nguon: 'agent',
    traLoi: `Mình đã chuẩn bị thao tác **${proposal.label}** từ yêu cầu của bạn. Bạn kiểm tra lại thông tin bên dưới rồi bấm **Xác nhận thực thi** để lưu nhé.`,
    hanhDong: {
      id: crypto.randomUUID(),
      ...proposal,
    },
    capNhatLuc: now.toISOString(),
  };
}

module.exports = {
  TOOL_DECLARATIONS,
  isActionCommandIntent,
  parseVietnameseMoney,
  parseVietnameseDateAndTime,
  sanitizeToolProposal,
  heuristicParseAgentAction,
  proposeAgentAction,
};
