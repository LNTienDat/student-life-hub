const {
  heuristicGenerateStudyPack,
  generateStudyPack,
} = require('../../src/modules/rag/study.service');

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

describe('RAG Study Generator (Quiz & Flashcards)', () => {
  test('heuristicGenerateStudyPack extracts Q&A pairs and builds valid 4-option quizzes', () => {
    const doc = {
      id: 7,
      tieuDe: 'Lap_Trinh_PYTHON',
      cacDoan: [
        {
          thuTu: 1,
          trang: 1,
          noiDung: [
            'Chương 1: TỔNG QUAN VỀ NGÔN NGỮ LẬP TRÌNH PYTHON',
            '1. Trình bày khái niệm chương trình dịch và vai trò của nó?',
            'Đáp án: Chuyển đổi mã nguồn bậc cao sang ngôn ngữ máy và phát hiện lỗi cú pháp.',
            '13. Giải thích lệnh "$pip install spyder" và vai trò của nó.',
            'Đáp án: Dùng pip tải và cài đặt IDE Spyder từ kho PyPI vào máy tính.',
            '14. Làm thế nào để kiểm tra phiên bản Python đã cài đặt?',
            'Đáp án: Gõ lệnh python --version hoặc python -V trên Terminal.',
            '16. Import mô-đun nào để sử dụng sqrt(), pow(), exp()?',
            'Đáp án: Mô-đun math.',
          ].join('\n'),
        },
      ],
    };

    const result = heuristicGenerateStudyPack(doc, doc.cacDoan, 4);
    expect(result.flashcards).toHaveLength(4);
    expect(result.flashcards[0].matTruoc).toContain('chương trình dịch');
    expect(result.flashcards[1].matSau).toContain('PyPI');
    expect(result.flashcards[0].trang).toBe(1);

    expect(result.quizzes).toHaveLength(4);
    for (const q of result.quizzes) {
      expect(q.luaChon).toHaveLength(4);
      expect(new Set(q.luaChon).size).toBe(4);
      expect(q.dapAnDung).toBeGreaterThanOrEqual(0);
      expect(q.dapAnDung).toBeLessThanOrEqual(3);
      expect(q.giaiThich).toContain(q.luaChon[q.dapAnDung]);
      expect(q.trang).toBe(1);
    }
  });

  test('generateStudyPack runs locally on built-in guide when dungAI=false without network call', async () => {
    const res = await generateStudyPack(42, 'huong-dan-lifehub', {
      soLuong: 4,
      chuDe: 'GPA',
      dungAI: false,
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.taiLieuId).toBe('huong-dan-lifehub');
    expect(res.engine).toBe('local-rag-extractor');
    expect(res.flashcards.length).toBeGreaterThanOrEqual(1);
    expect(res.quizzes.length).toBeGreaterThanOrEqual(1);
    expect(res.quizzes[0].luaChon).toHaveLength(4);
  });

  test('generateStudyPack uses Gemini structured JSON schema when enabled and valid', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: JSON.stringify({
                flashcards: [
                  {
                    matTruoc: 'LifeHub quy đổi GPA theo thang nào?',
                    matSau: 'Thang 10 và thang 4 chuẩn tín chỉ đại học.',
                    trang: 1,
                    trichDan: 'Quy đổi GPA thang 4 và thang 10 theo số tín chỉ.',
                  },
                ],
                quizzes: [
                  {
                    cauHoi: 'LifeHub tính GPA tích lũy dựa trên yếu tố nào?',
                    luaChon: [
                      'Điểm tổng kết nhân trọng số tín chỉ từng môn',
                      'Trung bình cộng không xét tín chỉ',
                      'Chỉ lấy điểm cao nhất của mỗi kỳ',
                      'Chỉ tính các môn đại cương năm nhất',
                    ],
                    dapAnDung: 0,
                    giaiThich: 'Hệ thống nhân điểm môn đạt với số tín chỉ rồi chia tổng tín chỉ.',
                    trang: 1,
                    trichDan: 'Tính theo trọng số tín chỉ.',
                  },
                ],
              }),
            }],
          },
        }],
      }),
    });

    const res = await generateStudyPack(42, 'huong-dan-lifehub', {
      soLuong: 4,
      dungAI: true,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema).toBeDefined();
    expect(res.engine).toBe('gemini-rag');
    expect(res.flashcards[0].matTruoc).toContain('GPA');
    expect(res.quizzes[0].dapAnDung).toBe(0);
    expect(res.quizzes[0].luaChon).toHaveLength(4);
  });

  test('generateStudyPack falls back cleanly to local-rag-extractor on Gemini 429', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });

    const res = await generateStudyPack(42, 'huong-dan-lifehub', {
      soLuong: 4,
      dungAI: true,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.engine).toBe('local-rag-extractor');
    expect(res.flashcards.length).toBeGreaterThanOrEqual(1);
    expect(res.quizzes.length).toBeGreaterThanOrEqual(1);
  });
});
