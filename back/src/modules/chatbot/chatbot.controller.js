const { answerDocumentQuestion } = require('../rag/rag.service');
const { CHATBOT } = require('../../constants');
const { layDuLieuSinhVien, timChuDe, traLoiDuLieu } = require('./chatbot.service');
const { cauHinhAI, hoiGemini } = require('./gemini.service');

function trangThaiChatbot(req, res) {
  const { sanSang, model } = cauHinhAI();
  res.set('Cache-Control', 'no-store');
  return res.json({ aiSanSang: sanSang, model, duLieuSanSang: true });
}
async function guiTinNhan(req, res) {
  res.set('Cache-Control', 'no-store');
  const { tinNhan, lichSu = [], cheDo = 'du_lieu', dongYGuiAI, dungDuLieuCaNhan = false, dungAI = false } = req.body || {};
  if (typeof tinNhan !== 'string' || !tinNhan.trim() || tinNhan.length > CHATBOT.MAX_MESSAGE_LENGTH) return res.status(400).json({ message: 'Nhập câu hỏi từ 1 đến 2000 ký tự.' });
  if (!['auto', 'du_lieu', 'ai', 'tai_lieu'].includes(cheDo) || typeof dungDuLieuCaNhan !== 'boolean') return res.status(400).json({ message: 'Chế độ trò chuyện không hợp lệ.' });
  if (!Array.isArray(lichSu) || lichSu.length > CHATBOT.MAX_HISTORY_LENGTH || lichSu.some(t => !t || !['user', 'bot'].includes(t.vaiTro) || typeof t.noiDung !== 'string' || !t.noiDung.trim() || t.noiDung.length > CHATBOT.MAX_MESSAGE_LENGTH) || lichSu.reduce((n, t) => n + t.noiDung.length, 0) > CHATBOT.MAX_HISTORY_CHARACTERS) return res.status(400).json({ message: 'Lịch sử trò chuyện quá dài hoặc không hợp lệ. Hãy bắt đầu cuộc trò chuyện mới.' });
  try {
    if (cheDo === 'auto') {
      const topics = timChuDe(tinNhan);
      if (topics.length) {
        const data = await layDuLieuSinhVien(req.user.id, topics);
        return res.json({ nguon: 'du_lieu', traLoi: traLoiDuLieu(data, tinNhan), capNhatLuc: data.capNhatLuc });
      }
      const document = await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI: false, dongYGuiAI: false });
      if (document.thamKhao?.length) {
        if (dungAI === true && dongYGuiAI === true && cauHinhAI().sanSang) return res.json(await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI: true, dongYGuiAI: true }));
        return res.json(document);
      }
      if (!cauHinhAI().sanSang || dongYGuiAI !== true) return res.json({ nguon: 'tai_lieu', traLoi: document.traLoi + (cauHinhAI().sanSang ? ' Nếu muốn nhận gợi ý từ AI, bạn có thể bật trong Tùy chọn trợ lý.' : ' Hiện tư vấn AI chưa được bật; tra cứu dữ liệu và tài liệu vẫn dùng được.'), thamKhao: [] });
      const data = dungDuLieuCaNhan ? await layDuLieuSinhVien(req.user.id) : null;
      const answer = await hoiGemini({ tinNhan: tinNhan.trim(), lichSu, duLieu: data });
      return res.json({ ...answer, nguon: 'ai', coDuLieuCaNhan: dungDuLieuCaNhan, capNhatLuc: data?.capNhatLuc });
    }
    if (cheDo === 'tai_lieu') return res.json(await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI, dongYGuiAI }));
    if (cheDo === 'du_lieu') {
      const topics = timChuDe(tinNhan);
      if (!topics.length) return res.json({ nguon: 'du_lieu', traLoi: 'Mình tra cứu được GPA, deadline quá hạn và 7 ngày tới, thu/chi tháng này, lịch học hôm nay hoặc ngày mai. Để hỏi cách học hay lập kế hoạch, bạn chọn Hỏi AI.' });
      const data = await layDuLieuSinhVien(req.user.id, topics);
      return res.json({ nguon: 'du_lieu', traLoi: traLoiDuLieu(data, tinNhan), capNhatLuc: data.capNhatLuc });
    }
    if (dongYGuiAI !== true) return res.status(400).json({ code: 'CHATBOT_CONSENT', message: 'Vui lòng đồng ý gửi câu hỏi đến Google trước khi dùng AI.' });
    if (!cauHinhAI().sanSang) return res.status(503).json({ code: 'CHATBOT_NOT_CONFIGURED', message: 'Phần tư vấn AI chưa được bật. Bạn vẫn có thể chọn Xem dữ liệu để tra cứu.' });
    const data = dungDuLieuCaNhan ? await layDuLieuSinhVien(req.user.id) : null;
    const answer = await hoiGemini({ tinNhan: tinNhan.trim(), lichSu, duLieu: data });
    return res.json({ ...answer, nguon: 'ai', coDuLieuCaNhan: dungDuLieuCaNhan, capNhatLuc: data?.capNhatLuc });
  } catch (error) {
    if (['auto', 'tai_lieu'].includes(cheDo) && error.statusCode) return res.status(error.statusCode).json({ code: error.code || 'CHATBOT_DOCUMENT', message: error.message });
    if (error.code?.startsWith('CHATBOT_')) return res.status(error.statusCode).json({ code: error.code, message: error.message });
    return res.status(503).json({ code: 'CHATBOT_DATA', message: 'Chưa đọc được dữ liệu của bạn. Hãy thử lại sau; mình chưa gửi câu hỏi đến AI.' });
  }
}
module.exports = { guiTinNhan, trangThaiChatbot };
