const { createHash } = require('crypto');
const LIMITS = { fileBytes: 4 * 1024 * 1024, documentChars: 200000, totalChars: 600000, documents: 20, pages: 100, chunkChars: 1200, overlap: 160 };
const stop = new Set('la va cua cho voi cac nhung mot nay do duoc trong khi thi de toi minh ban co khong nhu nao gi bao nhieu hay ve xin theo tu tai da se can phai duoc'.split(' '));
function normalize(text) { return text.normalize('NFKD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
// Canonical phrases preserve query coverage without adding unrelated synonym tokens.
const aliases = [
  [/\b(?:thoi khoa bieu|lich hoc|tkb)\b/g, 'tkb'],
  [/\b(?:diem trung binh tich luy|diem trung binh|gpa)\b/g, 'gpa'],
  [/\b(?:han nop|han chot|deadline)\b/g, 'deadline'],
  [/\b(?:hoa don|bill)\b/g, 'hoadon'],
];
function terms(text) {
  let value = normalize(text).replace(/\bra sao\b/g, ' ');
  for (const [pattern, canonical] of aliases) value = value.replace(pattern, canonical);
  return value.match(/[a-z0-9]+/g)?.filter(t => (t.length > 1 || /^\d$/.test(t)) && !stop.has(t)) || [];
}
function clean(text) { return text.normalize('NFC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
function chunkPages(pages) {
  const chunks = [];
  for (const page of pages) {
    const text = clean(page.text);
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + LIMITS.chunkChars, text.length);
      if (end < text.length) {
        const boundary = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf('. ', end), text.lastIndexOf(' ', end));
        if (boundary > start + LIMITS.chunkChars / 2) end = boundary + 1;
      }
      const content = text.slice(start, end).trim();
      if (content) chunks.push({ thuTu: chunks.length + 1, trang: page.page, noiDung: content });
      if (end === text.length) break;
      start = end - LIMITS.overlap;
      // Start overlap on a word boundary.
      while (start < end && /\S/.test(text[start - 1]) && /\S/.test(text[start])) start++;
    }
  }
  return chunks;
}
function contentHash(pages) { return createHash('sha256').update(pages.map(p => clean(p.text)).join('\n')).digest('hex'); }
function retrieve(documents, question, limit = 4) {
  const query = [...new Set(terms(question))].slice(0, 50);
  if (!query.length) return [];
  const chunks = documents.flatMap(doc => doc.cacDoan.map(chunk => {
    const tokens = terms(chunk.noiDung);
    const frequencies = new Map();
    tokens.forEach(token => frequencies.set(token, (frequencies.get(token) || 0) + 1));
    return { doc, chunk, frequencies, length: tokens.length || 1, titleTerms: new Set(terms(doc.tieuDe)) };
  }));
  if (!chunks.length) return [];
  const average = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length;
  const frequency = new Map(query.map(term => [term, chunks.filter(c => c.frequencies.has(term)).length]));
  const ranked = chunks.map(c => {
    let score = 0, matches = 0;
    for (const term of query) {
      const tf = c.frequencies.get(term) || 0;
      if (!tf) continue;
      matches++;
      const idf = Math.log(1 + (chunks.length - frequency.get(term) + 0.5) / (frequency.get(term) + 0.5));
      score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * c.length / average));
      if (c.titleTerms.has(term)) score += idf * 0.5;
    }
    return { ...c, score, coverage: matches / query.length, matches };
  }).filter(c => c.matches >= Math.min(2, query.length) && c.coverage >= 0.65 && c.score > 0)
    .sort((a, b) => b.score - a.score || String(a.doc.id).localeCompare(String(b.doc.id)) || a.chunk.thuTu - b.chunk.thuTu);
  const selected = [];
  const counts = new Map();
  for (const item of ranked) {
    if (item.score < ranked[0].score * 0.45 || (counts.get(item.doc.id) || 0) >= 2) continue;
    if (selected.some(c => c.chunk.noiDung === item.chunk.noiDung)) continue;
    selected.push(item); counts.set(item.doc.id, (counts.get(item.doc.id) || 0) + 1);
    if (selected.length === limit) break;
  }
  return selected.map(({ doc, chunk }, i) => ({
    ma: 'S' + (i + 1), idTaiLieu: doc.id, tieuDe: doc.tieuDe, tenTep: doc.tenTep,
    trang: chunk.trang, doan: chunk.thuTu, noiDung: chunk.noiDung,
  }));
}
function verifiedAnswer(raw, sources) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (parsed.duThongTin === false) return { duThongTin: false, traLoi: 'Tài liệu tìm được chưa đủ thông tin để trả lời câu hỏi này.', thamKhao: [] };
  if (parsed.duThongTin !== true || !Array.isArray(parsed.cauTraLoi) || !parsed.cauTraLoi.length || parsed.cauTraLoi.length > 6) return null;
  const used = new Set(), ids = new Set(sources.map(s => s.ma));
  const lines = [];
  for (const part of parsed.cauTraLoi) {
    if (!part || typeof part.noiDung !== 'string' || !part.noiDung.trim() || part.noiDung.length > 1500 || /\[\s*S\d+\s*\]/i.test(part.noiDung)
      || !Array.isArray(part.nguon) || !part.nguon.length || part.nguon.some(id => !ids.has(id))) return null;
    const evidence = sources.filter(source => part.nguon.includes(source.ma)).map(source => source.noiDung).join(' ');
    // Reject invented numeric facts and links even when a source id is valid.
    const numbers = part.noiDung.match(/\d+(?:[.,:/-]\d+)*/g) || [];
    const evidenceNumbers = new Set(evidence.match(/\d+(?:[.,:/-]\d+)*/g) || []);
    if (numbers.some(number => !evidenceNumbers.has(number))) return null;
    const links = part.noiDung.match(/https?:\/\/[^\s<>"\]]+/g) || [];
    if (links.some(link => !evidence.includes(link))) return null;
    part.nguon.forEach(id => used.add(id));
    lines.push(part.noiDung.trim() + ' ' + [...new Set(part.nguon)].map(id => '[' + id + ']').join(' '));
  }
  return { duThongTin: true, traLoi: lines.join('\n\n'), thamKhao: sources.filter(s => used.has(s.ma)) };
}
module.exports = { LIMITS, terms, clean, chunkPages, contentHash, retrieve, verifiedAnswer };
