import api from './api';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function hashFileSha256(file) {
  if (!file || !globalThis.crypto?.subtle) return '';
  try {
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

export async function compressImageForVision(file, { maxEdge = 1600, quality = 0.85 } = {}) {
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  }
  let bitmap;
  let canvas;
  try {
    bitmap = await createImageBitmap(file);
    const largest = Math.max(bitmap.width, bitmap.height);
    const scale = largest > maxEdge ? maxEdge / largest : 1;
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const comma = dataUrl.indexOf(',');
    return {
      mimeType: 'image/jpeg',
      imageBase64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
    };
  } catch (error) {
    if (error?.message?.includes('Chọn ảnh')) throw error;
    throw new Error('Không xử lý được ảnh để gửi AI Vision.', { cause: error });
  } finally {
    bitmap?.close?.();
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }
}

export async function fetchVisionOcrStatus() {
  const { data } = await api.get('/imports/ocr-ai/status');
  return data;
}

export async function scanReceiptWithAI(file, { signal, hash = '' } = {}) {
  const [{ mimeType, imageBase64 }, anhHoaDonHash] = await Promise.all([
    compressImageForVision(file),
    hash ? Promise.resolve(hash) : hashFileSha256(file),
  ]);
  const { data } = await api.post(
    '/imports/ocr-ai',
    { kind: 'receipt', dongYGuiAI: true, mimeType, imageBase64 },
    { signal }
  );
  return { ...data, anhHoaDonHash };
}

export async function scanTimetableWithAI(file, { signal } = {}) {
  const { mimeType, imageBase64 } = await compressImageForVision(file, { maxEdge: 1800, quality: 0.88 });
  const { data } = await api.post(
    '/imports/ocr-ai',
    { kind: 'timetable', dongYGuiAI: true, mimeType, imageBase64 },
    { signal }
  );
  const rows = (data.rows || []).map((row, index) => ({
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}-${index}`,
    selected: true,
    annotationBeforeTime: false,
    tenMon: row.tenMon || '',
    thu: row.thu || '',
    gioBatDau: row.gioBatDau || '',
    gioKetThuc: row.gioKetThuc || '',
    phongHoc: row.phongHoc || '',
    giangVien: row.giangVien || '',
    warning: '',
    source: 'AI Vision',
    timeBox: null,
  }));
  return { rows, text: `AI Vision (${data.model || 'Gemini'}): đã trích xuất ${rows.length} buổi học.` };
}
