const { createHash } = require('crypto');
const LIMITS = { fileBytes: 4 * 1024 * 1024, documentChars: 200000, totalChars: 600000, documents: 20, pages: 100, chunkChars: 1200, overlap: 160 };
const VECTOR_DIM = 64;
const stop = new Set('la va cua cho voi cac nhung mot nay do duoc trong khi thi de toi minh ban co khong nhu nao gi bao nhieu hay ve xin theo tu tai da se can phai duoc em oi nhe dum'.split(' '));
function normalize(text) { return text.normalize('NFKD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
// Canonical phrases preserve query coverage without adding unrelated synonym tokens.
const aliases = [
  [/\b(?:thoi khoa bieu|lich hoc|tkb)\b/g, 'tkb'],
  [/\b(?:diem trung binh tich luy|diem trung binh|gpa)\b/g, 'gpa'],
  [/\b(?:han nop|han chot|deadline)\b/g, 'deadline'],
  [/\b(?:hoa don|bill)\b/g, 'hoadon'],
];
const CONCEPTS = [
  /\b(?:diem chuan|diem trung tuyen|diem xet tuyen|diem san|tuyen sinh|xet tuyen|chi tieu|nguyen vong|to hop|khoi thi)\b/g,
  /\b(?:gpa|diem trung binh|diem tich luy|bang diem|diem thanh phan|trong so|thang diem)\b/g,
  /\b(?:tin chi|hoc phan|mon hoc|chuyen nganh|dai cuong|tu chon|bat buoc|de cuong)\b/g,
  /\b(?:canh bao hoc vu|mon nguy co|no mon|rot mon|hoc lai|thi lai|buoc thoi hoc|dinh chi)\b/g,
  /\b(?:hoc bong|tro cap|khen thuong|khuyen khich|mien giam|ho tro tai chinh)\b/g,
  /\b(?:hoc phi|le phi|dong tien hoc|cong no|hoan phi)\b/g,
  /\b(?:tot nghiep|ra truong|chuan dau ra|chung chi|khoa luan|do an tot nghiep|xet tot nghiep)\b/g,
  /\b(?:bao luu|tam ngung|tam nghi|rut mon|huy hoc phan|chuyen truong)\b/g,
  /\b(?:tkb|thoi khoa bieu|lich hoc|buoi hoc|tiet hoc|phong hoc|giang vien|nghi hoc|doi lich|lich thi)\b/g,
  /\b(?:deadline|han chot|han nop|qua han|cong viec|bai tap|nhiem vu|do uu tien)\b/g,
  /\b(?:thu chi|chi tieu|thu nhap|so du|giao dich|so tien|tai chinh)\b/g,
  /\b(?:ngan sach|han muc|vuot ngan sach|canh bao chi tieu|tiet kiem)\b/g,
  /\b(?:hoadon|hoa don|bill|bien lai|phieu thu|quet hoa don)\b/g,
  /\b(?:thu vien|muon sach|tra sach|gia han sach|giao trinh)\b/g,
  /\b(?:tai khoan|dang nhap|dang xuat|mat khau|xac thuc|bao mat|nhieu tab)\b/g,
  /\b(?:pwa|ung dung web|ket noi mang|xuat excel|xuat pdf|chia se)\b/g,
];
function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function conceptIds(text) {
  const norm = normalize(String(text || ''));
  const found = new Set();
  CONCEPTS.forEach((pattern, idx) => { if (new RegExp(pattern.source).test(norm)) found.add(idx); });
  return found;
}
function terms(text) {
  let value = normalize(text).replace(/\b(?:ra sao|cho (?:em|minh|toi) hoi|(?:em|minh) (?:muon )?hoi)\b/g, ' ');
  for (const [pattern, canonical] of aliases) value = value.replace(pattern, canonical);
  return value.match(/[a-z0-9]+/g)?.filter(t => (t.length > 1 || /^\d$/.test(t)) && !stop.has(t)) || [];
}
function embedText(text) {
  const vec = new Array(VECTOR_DIM).fill(0);
  const norm = normalize(String(text || ''));
  CONCEPTS.forEach((pattern, idx) => {
    const matches = norm.match(pattern);
    if (matches) vec[idx] += 2.5 * Math.min(3, matches.length);
  });
  const toks = terms(text);
  for (let i = 0; i < toks.length; i++) {
    const h1 = fnv1a(toks[i]);
    vec[16 + (h1 % 48)] += (h1 & 0x10000) ? 1 : -1;
    if (i + 1 < toks.length) {
      const h2 = fnv1a(toks[i] + '_' + toks[i + 1]);
      vec[16 + (h2 % 48)] += ((h2 & 0x10000) ? 1 : -1) * 1.25;
    }
  }
  const mag = Math.hypot(...vec);
  return mag > 0 ? vec.map(v => Number((v / mag).toFixed(6))) : vec;
}
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i]; }
  const denom = Math.sqrt(ma * mb);
  return denom > 0 ? dot / denom : 0;
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
  const normQuestion = normalize(question);
  const chapterMatch = /\bchuong\s*(\d+)\b/.exec(normQuestion);
  const wantsComprehensive = Boolean(chapterMatch)
    || /\b(?:may cau|bao nhieu cau|tong (?:so )?cau|bao nhieu muc|liet ke|tom tat|toan bo|day du|tat ca)\b/.test(normQuestion);
  const qVec = embedText(question);
  const qConcepts = conceptIds(question);
  const chunks = documents.flatMap(doc => doc.cacDoan.map(chunk => {
    const tokens = terms(chunk.noiDung);
    const frequencies = new Map();
    tokens.forEach(token => frequencies.set(token, (frequencies.get(token) || 0) + 1));
    const fullText = doc.tieuDe + ' ' + chunk.noiDung;
    const vector = Array.isArray(chunk.vector) && chunk.vector.length === VECTOR_DIM ? chunk.vector : embedText(fullText);
    return { doc, chunk, frequencies, length: tokens.length || 1, titleTerms: new Set(terms(doc.tieuDe)), vector, concepts: conceptIds(fullText) };
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
    const normChunk = normalize(c.chunk.noiDung);
    if (chapterMatch && new RegExp(`\\bchuong\\s*${chapterMatch[1]}\\b`).test(normChunk)) {
      score += 3.5;
    }
    const semantic = Math.max(0, cosineSimilarity(qVec, c.vector));
    const conceptMatches = [...qConcepts].filter(id => c.concepts.has(id)).length;
    if (matches > 0 || conceptMatches > 0) score += semantic * 1.8 + conceptMatches * 0.9;
    const coverage = matches / query.length;
    const lexicalPass = matches >= (query.length >= 6 ? 3 : Math.min(2, query.length)) && coverage >= (query.length >= 6 ? 0.5 : 0.65);
    const hybridPass = conceptMatches >= 1 && semantic >= 0.35 && ((matches >= 1 && (matches + conceptMatches * 2) / query.length >= 0.5) || (semantic >= 0.5 && conceptMatches * 2 >= query.length));
    return { ...c, score, coverage, matches, semantic, lexicalPass, hybridPass };
  }).filter(c => (c.lexicalPass || c.hybridPass) && c.score > 0)
    .sort((a, b) => b.score - a.score || String(a.doc.id).localeCompare(String(b.doc.id)) || a.chunk.thuTu - b.chunk.thuTu);

  if (!ranked.length) return [];

  const selected = [];
  if (wantsComprehensive) {
    const anchor = ranked[0];
    const docChunks = [...(anchor.doc.cacDoan || [])].sort((a, b) => a.thuTu - b.thuTu);
    const anchorIdx = docChunks.findIndex((c) => c.thuTu === anchor.chunk.thuTu);
    if (anchorIdx >= 0) {
      let startIdx = anchorIdx;
      if (chapterMatch) {
        const targetHeader = new RegExp(`\\bchuong\\s*${chapterMatch[1]}\\b`);
        for (let i = anchorIdx; i >= Math.max(0, anchorIdx - 3); i--) {
          startIdx = i;
          if (targetHeader.test(normalize(docChunks[i].noiDung))) break;
        }
      }
      const nextChapter = chapterMatch ? new RegExp(`(?:^|\\n)\\s*chuong\\s*(?!${chapterMatch[1]}\\b)\\d+\\b`) : null;
      const maxSpan = Math.max(limit, 8);
      for (let i = startIdx; i < docChunks.length && selected.length < maxSpan; i++) {
        const nextMatch = i > startIdx && nextChapter ? nextChapter.exec(normalize(docChunks[i].noiDung)) : null;
        if (nextMatch && nextMatch.index === 0) break;
        selected.push({ doc: anchor.doc, chunk: docChunks[i] });
        if (nextMatch) break;
      }
    }
  } else {
    const counts = new Map();
    const maxPerDoc = Math.min(4, limit);
    for (const item of ranked) {
      if (item.score < ranked[0].score * 0.45 || (counts.get(item.doc.id) || 0) >= maxPerDoc) continue;
      if (selected.some(c => c.chunk.noiDung === item.chunk.noiDung)) continue;
      selected.push(item); counts.set(item.doc.id, (counts.get(item.doc.id) || 0) + 1);
      if (selected.length === limit) break;
    }
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
    const hasNumber = n => evidenceNumbers.has(n) || evidenceNumbers.has(n.replaceAll(',', '.')) || evidenceNumbers.has(n.replaceAll('.', ','));
    if (numbers.some(number => !hasNumber(number))) return null;
    const links = part.noiDung.match(/https?:\/\/[^\s<>"\]]+/g) || [];
    if (links.some(link => !evidence.includes(link))) return null;
    part.nguon.forEach(id => used.add(id));
    lines.push(part.noiDung.trim() + ' ' + [...new Set(part.nguon)].map(id => '[' + id + ']').join(' '));
  }
  return { duThongTin: true, traLoi: lines.join('\n\n'), thamKhao: sources.filter(s => used.has(s.ma)) };
}
module.exports = { LIMITS, VECTOR_DIM, terms, embedText, cosineSimilarity, clean, chunkPages, contentHash, retrieve, verifiedAnswer };
