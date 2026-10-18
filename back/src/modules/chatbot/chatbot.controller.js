const { CHATBOT } = require('../../constants');
const { layNguCanhSinhVien } = require('./chatbot.service');

const GEMINI_MODEL = process.env.GEMINI_MODEL || CHATBOT.DEFAULT_MODEL;
const GEMINI_API_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Hướng dẫn hệ thống: cho Gemini biết nó là trợ lý cá nhân có quyền truy cập dữ liệu sinh viên
const HUONG_DAN_HE_THONG = `Bạn là trợ lý ảo cá nhân tên "SLH Bot" trong ứng dụng "Student Life Hub" — hệ thống quản lý học tập,
deadline và tài chính cho sinh viên Việt Nam. Bạn CÓ QUYỀN TRUY CẬP dữ liệu cá nhân của sinh viên.

Nhiệm vụ của bạn:
1. Trả lời ngắn gọn, thân thiện, bằng tiếng Việt (trừ khi người dùng hỏi bằng ngôn ngữ khác).
2. Sử dụng DỮ LIỆU CÁ NHÂN bên dưới để trả lời chính xác các câu hỏi về GPA, deadline, tài chính, lịch học.
3. Khi được hỏi về dữ liệu cá nhân, hãy trích dẫn con số cụ thể từ dữ liệu, không đoán mò.
4. Hướng dẫn sinh viên cách dùng các chức năng của app nếu được hỏi.
5. Có thể đưa ra lời khuyên về học tập, quản lý thời gian, tài chính dựa trên dữ liệu thực.
6. Nếu không có dữ liệu hoặc câu hỏi ngoài phạm vi, hãy thành thật nói rằng bạn không có thông tin.
Trả lời trong khoảng 2-6 câu. Dùng emoji phù hợp. Có thể dùng bullet list ngắn nếu cần liệt kê.`;

/**
 * POST /api/chatbot/hoi-dap
 * Xử lý tin nhắn từ người dùng, inject context cá nhân, gọi Gemini API
 * @param {Object} req.body - { tinNhan: string, lichSu: Array }
 */
async function guiTinNhan(req, res) {
  try {
    const { tinNhan, lichSu } = req.body;

    if (!tinNhan || !tinNhan.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn' });
    }
    if (tinNhan.length > 2000) {
      return res.status(400).json({ message: 'Tin nhắn quá dài, vui lòng rút gọn lại (tối đa 2000 ký tự)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        traLoi:
          'Chatbot chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env để kích hoạt tính năng này.',
        daCauHinh: false,
      });
    }

    // --- Context Injection: lấy dữ liệu cá nhân sinh viên ---
    let nguCanh = '';
    try {
      nguCanh = await layNguCanhSinhVien(req.user.id);
    } catch (err) {
      console.error('Lỗi lấy ngữ cảnh sinh viên:', err.message);
      // Vẫn tiếp tục trả lời dù không có context — graceful degradation
    }

    // Nối system prompt + dữ liệu cá nhân
    const systemPrompt = nguCanh
      ? `${HUONG_DAN_HE_THONG}\n\n--- DỮ LIỆU CÁ NHÂN CỦA SINH VIÊN ---\n${nguCanh}`
      : HUONG_DAN_HE_THONG;

    // Ghép lịch sử hội thoại gần nhất (tối đa 10 lượt) làm ngữ cảnh cho Gemini
    const contents = [];
    if (Array.isArray(lichSu)) {
      lichSu.slice(-CHATBOT.MAX_HISTORY_LENGTH).forEach((tin) => {
        contents.push({
          role: tin.vaiTro === 'bot' ? 'model' : 'user',
          parts: [{ text: tin.noiDung }],
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: tinNhan }] });

    const response = await fetch(GEMINI_API_URL(GEMINI_MODEL), {
      method: 'POST',
      signal: AbortSignal.timeout(CHATBOT.TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: CHATBOT.MAX_OUTPUT_TOKENS,
        },
      }),
    });

    if (!response.ok) {
      const loiChiTiet = await response.text();
      console.error('Lỗi Gemini API:', response.status, loiChiTiet);
      return res.status(502).json({
        message: 'Chatbot hiện không phản hồi được (lỗi từ Gemini API). Vui lòng thử lại sau.',
      });
    }

    const data = await response.json();
    const traLoi =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
      'Xin lỗi, mình chưa có câu trả lời phù hợp cho câu hỏi này.';

    res.json({ traLoi, daCauHinh: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi gọi chatbot' });
  }
}

module.exports = { guiTinNhan };