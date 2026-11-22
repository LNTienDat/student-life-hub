const crypto = require('node:crypto');
const dns = require('node:dns');
const { CHATBOT } = require('../../constants');
const { cauHinhAI } = require('../chatbot/gemini.service');
const { httpError } = require('../../utils/transaction.util');
const documentService = require('./document.service');
const { retrieve } = require('./rag.text');

const FALLBACK_DISTRACTORS = [
  'Tài liệu không đề cập hoặc không quy định nội dung này',
  'Chỉ áp dụng cho dữ liệu đã được lưu trữ từ các năm trước',
  'Hệ thống bắt buộc người dùng nhập lại thủ công hoàn toàn mỗi lần mở trang',
  'Tùy chọn này luôn bị vô hiệu hóa khi sử dụng ngoại tuyến',
];

const STUDY_SCHEMA = {
  type: 'OBJECT',
  required: ['flashcards', 'quizzes'],
  properties: {
    flashcards: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['matTruoc', 'matSau', 'trang', 'trichDan'],
        properties: {
          matTruoc: { type: 'STRING' },
          matSau: { type: 'STRING' },
          trang: { type: 'INTEGER' },
          trichDan: { type: 'STRING' },
        },
      },
    },
    quizzes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['cauHoi', 'luaChon', 'dapAnDung', 'giaiThich', 'trang', 'trichDan'],
        properties: {
          cauHoi: { type: 'STRING' },
          luaChon: { type: 'ARRAY', items: { type: 'STRING' } },
          dapAnDung: { type: 'INTEGER' },
          giaiThich: { type: 'STRING' },
          trang: { type: 'INTEGER' },
          trichDan: { type: 'STRING' },
        },
      },
    },
  },
};

function normalizeKey(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function selectStudyChunks(doc, chuDe = '', maxChars = 14000) {
  const allChunks = Array.isArray(doc?.cacDoan) ? doc.cacDoan : [];
  if (!allChunks.length) return [];

  const topic = String(chuDe || '').trim();
  if (topic) {
    const retrieved = retrieve([doc], topic, 8);
    if (retrieved.length) {
      const picked = [];
      let total = 0;
      for (const item of retrieved) {
        const len = String(item.noiDung || '').length;
        if (picked.length > 0 && total + len > maxChars) break;
        picked.push({
          thuTu: item.doan || picked.length + 1,
          trang: Number.isInteger(item.trang) ? item.trang : 1,
          noiDung: String(item.noiDung || ''),
        });
        total += len;
      }
      if (picked.length) return picked;
    }
  }

  const totalChars = allChunks.reduce((sum, c) => sum + String(c.noiDung || '').length, 0);
  if (totalChars <= maxChars) {
    return allChunks.map((c, idx) => ({
      thuTu: c.thuTu || idx + 1,
      trang: Number.isInteger(c.trang) ? c.trang : 1,
      noiDung: String(c.noiDung || ''),
    }));
  }

  // Evenly sample across the full document length when total size exceeds prompt budget.
  const avgLen = Math.max(200, Math.round(totalChars / allChunks.length));
  const approxSlices = Math.max(1, Math.min(allChunks.length, Math.floor(maxChars / avgLen)));
  const sampled = [];
  let charBudget = 0;

  for (let i = 0; i < approxSlices; i++) {
    const index = approxSlices === 1
      ? 0
      : Math.round((i * (allChunks.length - 1)) / (approxSlices - 1));
    const chunk = allChunks[index];
    if (!chunk || sampled.some((s) => s.thuTu === (chunk.thuTu || index + 1))) continue;
    const text = String(chunk.noiDung || '');
    if (sampled.length > 0 && charBudget + text.length > maxChars) continue;
    sampled.push({
      thuTu: chunk.thuTu || index + 1,
      trang: Number.isInteger(chunk.trang) ? chunk.trang : 1,
      noiDung: text,
    });
    charBudget += text.length;
  }

  return sampled.length ? sampled : [allChunks[0]];
}

function extractQaPairsFromChunks(chunks) {
  const pairs = [];
  for (const chunk of chunks) {
    const lines = String(chunk.noiDung || '').split(/\r?\n/);
    let question = '';
    let answer = '';
    let readingAnswer = false;
    const page = Number.isInteger(chunk.trang) ? chunk.trang : 1;

    const flush = () => {
      if (question && answer) {
        pairs.push({
          matTruoc: question.trim().slice(0, 350),
          matSau: answer.trim().slice(0, 600),
          trang: page,
          trichDan: `${question.trim()} — ${answer.trim()}`.slice(0, 220),
        });
      }
      question = '';
      answer = '';
      readingAnswer = false;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (readingAnswer) flush();
        continue;
      }
      if (/^(?:Chương|Phần|CHƯƠNG|PHẦN)\s+\d+\b/.test(line)) {
        flush();
        continue;
      }
      const qMatch = /^(?:Câu\s*)?(\d{1,3})[.):]\s+(.+)$/i.exec(line);
      if (qMatch && !/^\d+[.,]\d+/.test(line)) {
        flush();
        question = qMatch[2].trim();
        readingAnswer = false;
        continue;
      }
      if (question) {
        const aMatch = /^(?:Đáp án|Trả lời|Giải|Answer)\s*:\s*(.*)$/i.exec(line);
        if (aMatch) {
          readingAnswer = true;
          answer = aMatch[1].trim();
          continue;
        }
        if (readingAnswer) {
          answer = answer ? `${answer} ${line}` : line;
        } else if (question.length < 180) {
          question = `${question} ${line}`;
        }
      }
    }
    flush();
  }
  return pairs;
}

function extractFactPairsFromChunks(docTitle, chunks) {
  const facts = [];
  for (const chunk of chunks) {
    const page = Number.isInteger(chunk.trang) ? chunk.trang : 1;
    const rawLines = String(chunk.noiDung || '')
      .split(/\r?\n|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 28 && s.length <= 320);

    for (const line of rawLines) {
      if (/^(?:Chương|Phần)\s+\d+/i.test(line)) continue;
      if (/^(?:Đáp án|Trả lời|Giải|Answer)\s*:/i.test(line)) continue;

      const colonMatch = /^([A-ZÀ-Ỵ0-9][^:.\n]{2,65}):\s+(.{15,240})$/.exec(line);
      if (colonMatch && !/^https?$/i.test(colonMatch[1].trim())) {
        const subject = colonMatch[1].trim();
        const detail = colonMatch[2].trim();
        facts.push({
          matTruoc: `Theo tài liệu, "${subject}" là gì / quy định ra sao?`,
          matSau: detail,
          trang: page,
          trichDan: line.slice(0, 220),
        });
        continue;
      }

      const defMatch = /^(.{4,65}?)\s+(là|dùng để|giúp|bao gồm|cho phép)\s+(.{15,220}?)[.;]?$/i.exec(line);
      if (defMatch) {
        const subject = defMatch[1].replace(/^(?:-|\*|•|\d+[.)])\s*/, '').trim();
        if (subject.split(/\s+/).length <= 10) {
          facts.push({
            matTruoc: `Vai trò hoặc khái niệm của "${subject}" trong tài liệu?`,
            matSau: line,
            trang: page,
            trichDan: line.slice(0, 220),
          });
          continue;
        }
      }

      if (line.split(/\s+/).length >= 8) {
        facts.push({
          matTruoc: `Nội dung trọng tâm trong "${docTitle}" (trang ${page})?`,
          matSau: line,
          trang: page,
          trichDan: line.slice(0, 220),
        });
      }
    }
  }
  return facts;
}

function buildOptionsForQuiz(targetItem, candidateAnswers, index) {
  const correct = targetItem.matSau.slice(0, 180).trim();
  const seen = new Set([normalizeKey(correct)]);
  const distractors = [];

  for (const candidate of candidateAnswers) {
    if (distractors.length >= 3) break;
    const trimmed = candidate.slice(0, 180).trim();
    const key = normalizeKey(trimmed);
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    distractors.push(trimmed);
  }

  for (const fallback of FALLBACK_DISTRACTORS) {
    if (distractors.length >= 3) break;
    const key = normalizeKey(fallback);
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(fallback);
    }
  }

  const combined = [correct, ...distractors.slice(0, 3)];
  const shift = (index * 3 + correct.length) % 4;
  const luaChon = combined.map((_, pos) => combined[(pos + shift) % 4]);
  const dapAnDung = luaChon.indexOf(correct);

  return { luaChon, dapAnDung };
}

function heuristicGenerateStudyPack(doc, chunks, count = 6) {
  const safeChunks = chunks?.length ? chunks : [{ thuTu: 1, trang: 1, noiDung: doc?.tieuDe || 'Tài liệu học tập' }];
  const qaPairs = extractQaPairsFromChunks(safeChunks);
  const factPairs = extractFactPairsFromChunks(doc?.tieuDe || 'Tài liệu', safeChunks);

  const uniqueItems = [];
  const seenQuestions = new Set();
  const seenAnswers = new Set();

  for (const item of [...qaPairs, ...factPairs]) {
    const qKey = normalizeKey(item.matTruoc);
    const aKey = normalizeKey(item.matSau);
    if (!item.matTruoc || !item.matSau || seenQuestions.has(qKey) || seenAnswers.has(aKey)) continue;
    seenQuestions.add(qKey);
    seenAnswers.add(aKey);
    uniqueItems.push(item);
    if (uniqueItems.length >= Math.max(count, 8)) break;
  }

  if (!uniqueItems.length) {
    const first = safeChunks[0];
    uniqueItems.push({
      matTruoc: `Ý chính từ tài liệu "${doc?.tieuDe || 'Tài liệu'}" (trang ${first.trang})?`,
      matSau: String(first.noiDung || '').slice(0, 260).trim() || doc?.tieuDe || 'Nội dung tài liệu',
      trang: first.trang || 1,
      trichDan: String(first.noiDung || '').slice(0, 200).trim(),
    });
  }

  const flashcards = uniqueItems.slice(0, count).map((item) => ({
    id: crypto.randomUUID(),
    matTruoc: item.matTruoc,
    matSau: item.matSau,
    trang: item.trang,
    trichDan: item.trichDan,
  }));

  const answerPool = uniqueItems.map((item) => item.matSau);
  const quizzes = uniqueItems.slice(0, count).map((item, idx) => {
    const { luaChon, dapAnDung } = buildOptionsForQuiz(item, answerPool, idx);
    return {
      id: crypto.randomUUID(),
      cauHoi: item.matTruoc,
      luaChon,
      dapAnDung,
      giaiThich: `${item.matSau} (Nguồn: trang ${item.trang})`,
      trang: item.trang,
      trichDan: item.trichDan,
    };
  });

  return { flashcards, quizzes };
}

function sanitizeStudyPack(raw, chunks, count) {
  if (!raw || typeof raw !== 'object') return null;
  const validPages = new Set(chunks.map((c) => Number(c.trang)).filter((n) => Number.isInteger(n) && n > 0));
  const fallbackPage = [...validPages][0] || 1;
  const resolvePage = (p) => (Number.isInteger(p) && validPages.has(p) ? p : fallbackPage);

  const flashcards = [];
  if (Array.isArray(raw.flashcards)) {
    for (const card of raw.flashcards) {
      if (flashcards.length >= count) break;
      const matTruoc = typeof card?.matTruoc === 'string' ? card.matTruoc.trim().slice(0, 400) : '';
      const matSau = typeof card?.matSau === 'string' ? card.matSau.trim().slice(0, 800) : '';
      if (!matTruoc || !matSau) continue;
      flashcards.push({
        id: crypto.randomUUID(),
        matTruoc,
        matSau,
        trang: resolvePage(card.trang),
        trichDan: typeof card.trichDan === 'string' ? card.trichDan.trim().slice(0, 300) : '',
      });
    }
  }

  const quizzes = [];
  if (Array.isArray(raw.quizzes)) {
    for (const q of raw.quizzes) {
      if (quizzes.length >= count) break;
      const cauHoi = typeof q?.cauHoi === 'string' ? q.cauHoi.trim().slice(0, 400) : '';
      const giaiThich = typeof q?.giaiThich === 'string' ? q.giaiThich.trim().slice(0, 500) : '';
      const rawOptions = Array.isArray(q?.luaChon) ? q.luaChon : [];
      const cleanOptions = [];
      const seenOpt = new Set();
      for (const opt of rawOptions) {
        if (typeof opt !== 'string') continue;
        const t = opt.trim().slice(0, 240);
        const key = normalizeKey(t);
        if (!t || seenOpt.has(key)) continue;
        seenOpt.add(key);
        cleanOptions.push(t);
      }
      const correctIdx = Number(q?.dapAnDung);
      if (!cauHoi || cleanOptions.length !== 4 || !Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx > 3 || !giaiThich) {
        continue;
      }
      quizzes.push({
        id: crypto.randomUUID(),
        cauHoi,
        luaChon: cleanOptions,
        dapAnDung: correctIdx,
        giaiThich,
        trang: resolvePage(q.trang),
        trichDan: typeof q.trichDan === 'string' ? q.trichDan.trim().slice(0, 300) : '',
      });
    }
  }

  if (!flashcards.length || !quizzes.length) return null;
  return { flashcards, quizzes };
}

async function callGeminiStudyGenerator(doc, chunks, count, chuDe) {
  const config = cauHinhAI();
  if (!config.sanSang) return null;

  const excerptPayload = chunks.map((c) => ({
    trang: c.trang,
    doan: c.thuTu,
    noiDung: c.noiDung,
  }));

  const systemInstruction = [
    'Bạn là trợ lý sư phạm của LifeHub chuyên tạo Flashcard ghi nhớ và Câu hỏi trắc nghiệm 4 lựa chọn.',
    `Hãy tạo ĐÚNG ${count} flashcard và ${count} câu hỏi trắc nghiệm từ CÁC TRÍCH ĐOẠN TÀI LIỆU dưới đây.`,
    chuDe ? `Chủ đề trọng tâm người dùng muốn ôn: "${chuDe}".` : '',
    'QUY TẮC BẮT BUỘC:',
    '- Chỉ sử dụng kiến thức, số liệu và quy định CÓ THẬT trong các trích đoạn; không tự bịa thêm.',
    '- Mỗi flashcard có matTruoc (câu hỏi/khái niệm), matSau (đáp án súc tích), trang (đúng số trang trích đoạn), trichDan (câu ngắn chứng minh).',
    '- Mỗi quiz có luaChon gồm ĐÚNG 4 phương án khác nhau rõ ràng, dapAnDung là chỉ số 0..3, giaiThich giải thích ngắn vì sao đúng.',
    '- Toàn bộ nội dung phản hồi bằng tiếng Việt (hoặc theo ngôn ngữ chính của tài liệu).',
  ].filter(Boolean).join('\n');

  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
    responseSchema: STUDY_SCHEMA,
  };
  if (config.model === 'gemini-3.5-flash-lite') {
    generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL', includeThoughts: false };
  }

  dns.setDefaultResultOrder('ipv4first');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(CHATBOT.TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.key },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `Tài liệu: "${doc.tieuDe}"\nTrích đoạn JSON:\n${JSON.stringify(excerptPayload)}` }],
      }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const rawJson = parts.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('').trim();
  if (!rawJson) return null;

  const parsed = JSON.parse(rawJson);
  return sanitizeStudyPack(parsed, chunks, count);
}

async function generateStudyPack(idNguoiDung, docId, options = {}) {
  const { soLuong = 6, chuDe = '', dungAI = true } = options || {};
  if (typeof chuDe !== 'string' || chuDe.length > 160) {
    throw httpError(400, 'Chủ đề ôn tập tối đa 160 ký tự.');
  }
  const rawCount = Number(soLuong);
  const count = Number.isFinite(rawCount) ? Math.min(12, Math.max(3, Math.round(rawCount))) : 6;
  const allowAI = dungAI !== false;

  const doc = await documentService.readDocument(idNguoiDung, docId);
  const chunks = selectStudyChunks(doc, chuDe);

  let pack = null;
  let engine = 'local-rag-extractor';

  if (allowAI && cauHinhAI().sanSang) {
    try {
      pack = await callGeminiStudyGenerator(doc, chunks, count, chuDe.trim());
      if (pack) engine = 'gemini-rag';
    } catch {
      pack = null;
    }
  }

  if (!pack) {
    pack = heuristicGenerateStudyPack(doc, chunks, count);
    engine = 'local-rag-extractor';
  }

  return {
    taiLieuId: doc.id,
    tieuDe: doc.tieuDe,
    engine,
    chuDe: chuDe.trim(),
    flashcards: pack.flashcards,
    quizzes: pack.quizzes,
    taoLuc: new Date().toISOString(),
  };
}

module.exports = {
  selectStudyChunks,
  heuristicGenerateStudyPack,
  sanitizeStudyPack,
  generateStudyPack,
};
