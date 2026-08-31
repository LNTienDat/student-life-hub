const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_API_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Hướng dẫn hệ thống: cho Gemini biết nó là chatbot hỗ trợ trong app Student Life Hub
const HUONG_DAN_HE_THONG = `Bạn là trợ lý ảo tên "SLH Bot" trong ứng dụng "Student Life Hub" — hệ thống quản lý học tập,
deadline và tài chính cho sinh viên Việt Nam. Nhiệm vụ của bạn:
1. Trả lời ngắn gọn, thân thiện, bằng tiếng Việt (trừ khi người dùng hỏi bằng ngôn ngữ khác).
2. Hướng dẫn sinh viên cách dùng các chức năng của app: Dashboard (tổng quan), Học tập (CRUD môn học,
   nhập điểm, tính GPA, dự đoán điểm), Deadline (quản lý deadline dạng danh sách/lịch), Thời khóa biểu
   (lịch học tuần), Tài chính (thu chi, ngân sách, biểu đồ), Hồ sơ (thông tin cá nhân).
3. Có thể trả lời các câu hỏi chung về học tập, quản lý thời gian, quản lý tài chính cá nhân cho sinh viên.
4. Nếu không chắc chắn hoặc câu hỏi ngoài phạm vi, hãy thành thật nói rằng bạn không chắc.
Trả lời trong khoảng 2-5 câu, không dùng markdown phức tạp.`;

// Gửi tin nhắn tới chatbot (Gemini Flash), có thể kèm lịch sử hội thoại ngắn
async function guiTinNhan(req, res) {
  try {
    const { tinNhan, lichSu } = req.body;

    if (!tinNhan || !tinNhan.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        traLoi:
          'Chatbot chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env để kích hoạt tính năng này.',
        daCauHinh: false,
      });
    }

    // Ghép lịch sử hội thoại gần nhất (tối đa 10 lượt) làm ngữ cảnh cho Gemini
    const contents = [];
    if (Array.isArray(lichSu)) {
      lichSu.slice(-10).forEach((tin) => {
        contents.push({
          role: tin.vaiTro === 'bot' ? 'model' : 'user',
          parts: [{ text: tin.noiDung }],
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: tinNhan } ] });

    const response = await fetch(`${GEMINI_API_URL(GEMINI_MODEL)}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: HUONG_DAN_HE_THONG }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
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