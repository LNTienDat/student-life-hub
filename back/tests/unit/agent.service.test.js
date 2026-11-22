const {
  isActionCommandIntent,
  parseVietnameseMoney,
  heuristicParseAgentAction,
  proposeAgentAction,
} = require('../../src/modules/chatbot/agent.service');

const originalFetch = global.fetch;
const oldEnv = { ...process.env };

beforeEach(() => {
  process.env.CHATBOT_AI_ENABLED = 'true';
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key-2026';
  process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...oldEnv };
});

describe('AI Agent Tool-Calling Service', () => {
  test('isActionCommandIntent detects write actions and rejects read queries/advice', () => {
    const positives = [
      'Ghi chi 45k trà sữa hôm nay',
      'Chi bốn mươi lăm nghìn ăn trưa',
      'Ghi thu 4tr5 lương thực tập',
      'Tạo deadline nộp báo cáo ngày mai ưu tiên cao',
      'Nhắc tôi ôn tập giữa kỳ tối nay lúc 19h',
      'Thêm lịch học Lập trình Python thứ 3 từ 7h30 đến 9h30 phòng A204',
      'Đặt ngân sách ăn uống tháng này 3tr',
    ];
    for (const cmd of positives) {
      expect(isActionCommandIntent(cmd)).toBe(true);
    }

    const negatives = [
      'GPA?',
      'Tháng này chi tiêu bao nhiêu?',
      'Tóm tắt thu chi năm 2020 và t10',
      'Thu chi tháng 10 thế nào?',
      'Hôm qua học gì?',
      'Cách thêm deadline như thế nào?',
      'Lập kế hoạch học tuần này',
      'Quy định?',
      'Gợi ý học',
      'Chi tiêu năm 2020 ra sao?',
    ];
    for (const query of negatives) {
      expect(isActionCommandIntent(query)).toBe(false);
    }
  });

  test('parseVietnameseMoney parses numbers, abbreviations, grouped formats, and spoken voice phrases', () => {
    expect(parseVietnameseMoney('45k')).toBe(45000);
    expect(parseVietnameseMoney('1.5tr')).toBe(1500000);
    expect(parseVietnameseMoney('2tr5')).toBe(2500000);
    expect(parseVietnameseMoney('2 triệu 500 nghìn')).toBe(2500000);
    expect(parseVietnameseMoney('120.000đ')).toBe(120000);
    expect(parseVietnameseMoney('chi bốn mươi lăm nghìn trà sữa')).toBe(45000);
    expect(parseVietnameseMoney('hai trăm nghìn tiền xăng')).toBe(200000);
    expect(parseVietnameseMoney('một triệu rưỡi tiền nhà')).toBe(1500000);
    expect(parseVietnameseMoney('thu chi năm 2020 tháng 10')).toBeNull();
  });

  test('heuristicParseAgentAction handles all 4 tools accurately', () => {
    const now = new Date('2026-11-22T09:00:00+07:00'); // Sunday (weekday=7 -> thu=8)

    const chiAction = heuristicParseAgentAction('Ghi chi 45k trà sữa hôm nay', now);
    expect(chiAction.tool).toBe('create_transaction');
    expect(chiAction.params).toMatchObject({
      loai: 'chi',
      soTien: 45000,
      danhMuc: 'an_uong',
      ngayGiaoDich: '2026-11-22',
    });

    const thuAction = heuristicParseAgentAction('Ghi thu 6tr học bổng khuyến khích', now);
    expect(thuAction.tool).toBe('create_transaction');
    expect(thuAction.params).toMatchObject({
      loai: 'thu',
      soTien: 6000000,
      danhMuc: 'hoc_bong',
    });

    const dlAction = heuristicParseAgentAction('Tạo deadline nộp báo cáo đồ án ngày mai lúc 18h ưu tiên cao', now);
    expect(dlAction.tool).toBe('create_deadline');
    expect(dlAction.params).toMatchObject({
      hanChot: '2026-11-23T18:00',
      doUuTien: 'cao',
    });
    expect(dlAction.params.tieuDe.toLowerCase()).toContain('báo cáo đồ án');

    const tkbAction = heuristicParseAgentAction('Thêm lịch học Cơ sở dữ liệu thứ 4 từ 7h30 đến 9h30 phòng C302', now);
    expect(tkbAction.tool).toBe('create_class_session');
    expect(tkbAction.params).toMatchObject({
      thu: 4,
      gioBatDau: '07:30',
      gioKetThuc: '09:30',
      phongHoc: 'C302',
    });
    expect(tkbAction.params.tenMon).toContain('Cơ sở dữ liệu');

    const budgetAction = heuristicParseAgentAction('Đặt ngân sách ăn uống tháng 12 năm 2026 là 3tr5', now);
    expect(budgetAction.tool).toBe('set_budget');
    expect(budgetAction.params).toMatchObject({
      danhMuc: 'an_uong',
      soTienToiDa: 3500000,
      thang: 12,
      nam: 2026,
    });
  });

  test('proposeAgentAction respects consent, uses Gemini function calling when opted in, and falls back gracefully on error', async () => {
    const now = new Date('2026-11-22T09:00:00+07:00');

    // Without AI consent -> local-agent-parser, zero external calls
    const localProposal = await proposeAgentAction({
      tinNhan: 'Ghi chi 50k đổ xăng hôm nay',
      dungAI: true,
      dongYGuiAI: false,
      now,
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(localProposal.nguon).toBe('agent');
    expect(localProposal.hanhDong.engine).toBe('local-agent-parser');
    expect(localProposal.hanhDong.params).toMatchObject({ loai: 'chi', soTien: 50000, danhMuc: 'di_lai' });

    // With AI consent & Gemini functionCall -> gemini-function-calling
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              functionCall: {
                name: 'create_deadline',
                args: {
                  tieuDe: 'Nộp tiểu luận AI',
                  hanChot: '2026-11-25T20:00',
                  doUuTien: 'cao',
                },
              },
            }],
          },
        }],
      }),
    });

    const geminiProposal = await proposeAgentAction({
      tinNhan: 'Tạo deadline nộp tiểu luận AI thứ tư tuần này 8h tối gấp',
      dungAI: true,
      dongYGuiAI: true,
      now,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tools[0].functionDeclarations).toHaveLength(4);
    expect(geminiProposal.nguon).toBe('agent');
    expect(geminiProposal.hanhDong.engine).toBe('gemini-function-calling');
    expect(geminiProposal.hanhDong.params).toMatchObject({
      tieuDe: 'Nộp tiểu luận AI',
      hanChot: '2026-11-25T20:00',
      doUuTien: 'cao',
    });

    // When Gemini 429s -> falls back to local-agent-parser without throwing
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const fallbackProposal = await proposeAgentAction({
      tinNhan: 'Ghi chi 80k cà phê',
      dungAI: true,
      dongYGuiAI: true,
      now,
    });
    expect(fallbackProposal.hanhDong.engine).toBe('local-agent-parser');
    expect(fallbackProposal.hanhDong.params).toMatchObject({ soTien: 80000, danhMuc: 'an_uong' });
  });
});
