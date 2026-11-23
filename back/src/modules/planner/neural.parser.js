const dns = require('node:dns');
const { cauHinhAI } = require('../chatbot/gemini.service');
const { normalizeConstraints } = require('./symbolic.solver');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .toLowerCase();
}

function heuristicParseConstraints(promptText = '', subjectNames = []) {
  const q = normalizeText(promptText);
  const patch = {};

  if (!q.trim()) {
    return patch;
  }

  const windows = [];
  if (/\bsang\b/.test(q)) windows.push('morning');
  if (/\bchieu\b/.test(q)) windows.push('afternoon');
  if (/\b(?:toi|dem|khuya)\b/.test(q)) windows.push('evening');
  if (windows.length) patch.preferredWindows = windows;

  const avoid = new Set();
  if (/(?:nghi|tranh|khong hoc)\s*(?:chu nhat|cn)\b/.test(q)) avoid.add(8);
  if (/cuoi tuan/.test(q) && /(?:nghi|tranh|khong hoc)/.test(q)) {
    avoid.add(7);
    avoid.add(8);
  }
  const dayMatches = q.matchAll(/(?:nghi|tranh|khong hoc)\s*thu\s*([2-7])/g);
  for (const m of dayMatches) {
    avoid.add(Number(m[1]));
  }
  if (avoid.size) patch.avoidWeekdays = [...avoid];

  const latestMatch = /(?:truoc|khong hoc sau|toi da)\s*(\d{1,2})\s*(?:h|gio)\b/.exec(q);
  if (latestMatch) patch.latestHour = Number(latestMatch[1]);

  const earliestMatch = /(?:sau|bat dau tu|tu)\s*(\d{1,2})\s*(?:h|gio)\b/.exec(q);
  if (earliestMatch) patch.earliestHour = Number(earliestMatch[1]);

  if (/\b60\s*(?:phut|p)\b|\b1\s*(?:gio|tieng)\b/.test(q)) patch.sessionMinutes = 60;
  else if (/\b90\s*(?:phut|p)\b|\b1[.,]5\s*(?:gio|tieng)\b/.test(q)) patch.sessionMinutes = 90;
  else if (/\b120\s*(?:phut|p)\b|\b2\s*(?:gio|tieng)\b/.test(q)) patch.sessionMinutes = 120;

  const totalMatch = /\b(\d{1,2})\s*(?:buoi|phien)\b/.exec(q);
  if (totalMatch) patch.totalSessionsTarget = Number(totalMatch[1]);

  const matchedSubjects = [];
  for (const name of subjectNames) {
    const n = normalizeText(name);
    if (n && n.length >= 2 && q.includes(n)) {
      matchedSubjects.push(name);
    }
  }
  if (matchedSubjects.length) {
    patch.focusTopics = matchedSubjects.slice(0, 6);
  }

  return patch;
}

async function parseNaturalConstraints({ prompt = '', subjectNames = [], useAI = true, dongYGuiAI = false }, deps = {}) {
  const trimmed = String(prompt || '').trim();
  const heuristic = heuristicParseConstraints(trimmed, subjectNames);
  const config = (deps.getAiConfig || cauHinhAI)();

  if (!trimmed || !useAI || !dongYGuiAI || !config.sanSang) {
    return {
      source: 'symbolic_rules',
      model: null,
      constraints: normalizeConstraints(heuristic),
      summary: trimmed
        ? 'Đã phân tích yêu cầu thành ràng buộc bằng bộ luật nội bộ.'
        : 'Đang dùng cấu hình ràng buộc chuẩn kết hợp dữ liệu môn học, lịch học và deadline của bạn.',
    };
  }

  const systemPrompt = [
    'Bạn là bộ phân tích ý định (Neural Intent Parser) cho hệ thống xếp lịch ôn tập Neuro-Symbolic.',
    'Từ yêu cầu tự nhiên của sinh viên và danh sách tên môn học hiện có, hãy trích xuất các ràng buộc lập lịch thành JSON:',
    '- earliestHour (số nguyên 5..22, mặc định 7)',
    '- latestHour (số nguyên 8..24, mặc định 22; ví dụ "trước 22h" -> 22)',
    '- preferredWindows (mảng gồm "morning", "afternoon", "evening")',
    '- avoidWeekdays (mảng số nguyên 2..8 cần tránh, với 8 = Chủ nhật)',
    '- sessionMinutes (chọn một trong 60, 90, 120)',
    '- maxSessionsPerDay (số nguyên 1..4)',
    '- totalSessionsTarget (số nguyên 1..18, số buổi muốn xếp trong tuần)',
    '- focusTopics (mảng tên môn học hoặc chủ đề sinh viên nhấn mạnh muốn ưu tiên)',
    '- summary (1 câu tiếng Việt tóm tắt chiến lược ưu tiên đã trích xuất)',
  ].join('\n');

  const schema = {
    type: 'OBJECT',
    required: ['earliestHour', 'latestHour', 'preferredWindows', 'avoidWeekdays', 'sessionMinutes', 'maxSessionsPerDay', 'totalSessionsTarget', 'focusTopics', 'summary'],
    properties: {
      earliestHour: { type: 'INTEGER' },
      latestHour: { type: 'INTEGER' },
      preferredWindows: { type: 'ARRAY', items: { type: 'STRING' } },
      avoidWeekdays: { type: 'ARRAY', items: { type: 'INTEGER' } },
      sessionMinutes: { type: 'INTEGER' },
      maxSessionsPerDay: { type: 'INTEGER' },
      totalSessionsTarget: { type: 'INTEGER' },
      focusTopics: { type: 'ARRAY', items: { type: 'STRING' } },
      summary: { type: 'STRING' },
    },
  };

  try {
    dns.setDefaultResultOrder('ipv4first');
    const fetchImpl = deps.fetchImpl || fetch;
    const generationConfig = {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
      responseSchema: schema,
    };
    if (config.model === 'gemini-3.5-flash-lite') {
      generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL', includeThoughts: false };
    }

    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.key },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: `${systemPrompt}\n\nDanh sách môn học: ${subjectNames.join(', ') || 'Chưa có'}\nYêu cầu sinh viên: ${trimmed}`,
            }],
          }],
          generationConfig,
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought && typeof p.text === 'string')
      .map((p) => p.text)
      .join('')
      .trim();
    if (!rawText) throw new Error('EMPTY_RESPONSE');

    const parsed = JSON.parse(rawText);
    const merged = normalizeConstraints({
      ...parsed,
      // Keep explicit deterministic matches if AI missed any
      avoidWeekdays: parsed.avoidWeekdays?.length ? parsed.avoidWeekdays : heuristic.avoidWeekdays,
      preferredWindows: parsed.preferredWindows?.length ? parsed.preferredWindows : heuristic.preferredWindows,
      focusTopics: parsed.focusTopics?.length ? parsed.focusTopics : heuristic.focusTopics,
    });

    return {
      source: 'neural_gemini',
      model: config.model,
      constraints: merged,
      summary: typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim().slice(0, 220)
        : 'Đã hiểu yêu cầu và xếp lịch phù hợp.',
    };
  } catch {
    return {
      source: 'symbolic_fallback',
      model: null,
      constraints: normalizeConstraints(heuristic),
      summary: 'AI tạm gián đoạn — đã tự động chuyển sang bộ phân tích ràng buộc nội bộ (100% đúng giờ học).',
    };
  }
}

module.exports = {
  heuristicParseConstraints,
  parseNaturalConstraints,
};
