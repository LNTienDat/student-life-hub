const { cauHinhAI, hoiGemini } = require('../../src/modules/chatbot/gemini.service');
const originalFetch = global.fetch;
const oldEnv = { ...process.env };
const question = { tinNhan: 'Gợi ý cách học', lichSu: [], duLieu: null };
beforeEach(() => {
  process.env.CHATBOT_AI_ENABLED = 'true';
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key-2026';
  process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = originalFetch; process.env = { ...oldEnv }; });
test('AI is disabled unless explicitly enabled with non-placeholder configuration', async () => {
  process.env.CHATBOT_AI_ENABLED = 'false';
  await expect(hoiGemini(question)).rejects.toMatchObject({ code: 'CHATBOT_NOT_CONFIGURED' });
  expect(global.fetch).not.toHaveBeenCalled();
  process.env.CHATBOT_AI_ENABLED = 'true'; process.env.GEMINI_API_KEY = 'your_gemini_api_key';
  expect(cauHinhAI().sanSang).toBe(false);
});
test('model cannot inject a new host or path', () => {
  process.env.GEMINI_MODEL = '../../evil.example'; expect(cauHinhAI().sanSang).toBe(false);
});

test('planning request includes fresh schedule context, conversation and room for a concrete plan', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Kế hoạch đề xuất.' }] } }] }) });
  const context = { capNhatLuc: '2026-11-04T07:00:00Z', lichHoc: { lich: [{ ngay: '2026-11-05', mon: 'Toán', batDau: '07:00', ketThuc: '09:00' }] } };
  await hoiGemini({ tinNhan: 'Lập kế hoạch học tuần này', lichSu: [{ vaiTro: 'user', noiDung: 'Tôi rảnh buổi tối' }, { vaiTro: 'bot', noiDung: 'Bạn cần ôn môn nào?' }], duLieu: context });
  const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(payload.contents).toHaveLength(3);
  expect(payload.generationConfig.maxOutputTokens).toBe(1000);
  expect(payload.systemInstruction.parts[0].text).toContain('tránh chồng giờ');
  expect(payload.systemInstruction.parts[0].text).toContain(JSON.stringify(context));
});
test('uses one request, key in header, minimal thinking and filters thought output', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'private thought' }, { text: 'Chia bài học thành các phần nhỏ.' }] } }] }) });
  const answer = await hoiGemini(question);
  expect(answer.traLoi).toBe('Chia bài học thành các phần nhỏ.');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).not.toContain(process.env.GEMINI_API_KEY);
  expect(options.headers['x-goog-api-key']).toBe(process.env.GEMINI_API_KEY);
  expect(JSON.parse(options.body).generationConfig.thinkingConfig.thinkingLevel).toBe('MINIMAL');
  expect(JSON.parse(options.body).contents).toHaveLength(1);
});
test.each([[429, 'CHATBOT_QUOTA'], [401, 'CHATBOT_CONFIGURATION'], [403, 'CHATBOT_CONFIGURATION'], [404, 'CHATBOT_CONFIGURATION'], [500, 'CHATBOT_PROVIDER']])('provider %s gives a useful safe error without replay', async (status, code) => {
  global.fetch.mockResolvedValue({ ok: false, status, text: () => { throw new Error('Raw provider body must not be read/logged'); } });
  await expect(hoiGemini(question)).rejects.toMatchObject({ code });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test('timeouts are bounded and distinguishable', async () => {
  global.fetch.mockRejectedValue(Object.assign(new Error('secret raw response'), { name: 'TimeoutError' }));
  await expect(hoiGemini(question)).rejects.toMatchObject({ statusCode: 504, code: 'CHATBOT_TIMEOUT' });
});
test.each([{ promptFeedback: { blockReason: 'SAFETY' } }, { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] }])('empty/blocked responses are errors, not successful AI replies', async data => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => data });
  await expect(hoiGemini(question)).rejects.toMatchObject({ code: 'CHATBOT_NO_ANSWER' });
});
test('truncated output is labelled', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Partial' }] } }] }) });
  expect((await hoiGemini(question)).biRutGon).toBe(true);
});
