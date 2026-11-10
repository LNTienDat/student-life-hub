// Conservative spelling suggestions for common academic phrases; proper names stay untouched.
const phrases = [
  'lập trình', 'thực hành', 'phương pháp', 'nghiên cứu', 'báo cáo', 'khoa học',
  'kỹ năng', 'nghề nghiệp', 'xử lý ảnh', 'ngôn ngữ', 'mô hình hóa', 'điện toán',
  'đám mây', 'cơ sở dữ liệu', 'cấu trúc dữ liệu', 'giải thuật', 'mạng máy tính',
  'hệ điều hành', 'công nghệ', 'phần mềm', 'trí tuệ nhân tạo', 'toán cao cấp',
  'xác suất', 'thống kê', 'đại số', 'tuyến tính', 'kinh tế', 'tiếng Anh',
  'đồ án', 'chuyên ngành', 'hệ thống', 'thông tin', 'ứng dụng', 'phân tích',
  'thiết kế', 'kiến trúc', 'lý thuyết', 'kiểm thử', 'an toàn thông tin',
];
const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const courseKey = text => fold(text).replace(/\s*[‐‑‒–—−-]\s*/g, '-').replace(/\s+/g, ' ').trim();
function distance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : /[aeiouy]/.test(a[i - 1]) && /[aeiouy]/.test(b[j - 1]) ? 0.4 : ['lt', 'tl'].includes(a[i - 1] + b[j - 1]) ? 0.5 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}
export function restoreCourseText(value, knownSubjects = []) {
  const source = String(value || '').normalize('NFC');
  const known = [...new Set(knownSubjects.map(name => String(name).trim()).filter(Boolean))];
  const same = known.filter(name => courseKey(name) === courseKey(source));
  if (same.length === 1) return same[0];
  const words = [...source.matchAll(/[\p{L}\p{N}]+/gu)];
  let result = '', cursor = 0;
  for (let i = 0; i < words.length; i++) {
    let replacement = null;
    for (let size = Math.min(4, words.length - i); size >= 2 && !replacement; size--) {
      const end = words[i + size - 1].index + words[i + size - 1][0].length;
      const part = source.slice(words[i].index, end);
      if (!/^\p{L}+(?:\s+\p{L}+)+$/u.test(part)) continue;
      const candidates = phrases.filter(phrase => phrase.split(' ').length === size)
        .map(phrase => ({ phrase, score: distance(fold(part), fold(phrase)) }))
        .sort((a, b) => a.score - b.score);
      const best = candidates[0];
      // Short phrases only allow vowel confusion; longer phrases allow one OCR character error.
      const limit = fold(part).replaceAll(' ', '').length >= 6 ? 1 : 0.81;
      if (best && best.score <= limit && (!candidates[1] || candidates[1].score - best.score > 0.4)) {
        let phrase = best.phrase;
        if (part === part.toLocaleUpperCase('vi')) phrase = phrase.toLocaleUpperCase('vi');
        else if (part[0] === part[0].toLocaleUpperCase('vi')) phrase = phrase[0].toLocaleUpperCase('vi') + phrase.slice(1);
        replacement = { text: phrase, end, size };
      }
    }
    if (replacement) {
      result += source.slice(cursor, words[i].index) + replacement.text;
      cursor = replacement.end;
      i += replacement.size - 1;
    }
  }
  return (result + source.slice(cursor)).replace(/\bva\b/g, 'và');
}
export function confirmedTimeRange(ranges) {
  const votes = new Map();
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) || range[0] >= range[1]) continue;
    const key = range.join('|');
    votes.set(key, (votes.get(key) || 0) + 1);
  }
  const winners = [...votes].filter(([, count]) => count >= 2);
  return winners.length === 1 ? winners[0][0].split('|') : null;
}
