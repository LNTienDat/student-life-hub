const { answerDocumentQuestion } = require('../rag/rag.service');
const { CHATBOT } = require('../../constants');
const { layDuLieuSinhVien, timChuDe, traLoiDuLieu } = require('./chatbot.service');
const { cauHinhAI, hoiGemini } = require('./gemini.service');

function isFinancePeriodQuery(text) {
  const q = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').toLowerCase();
  if (/tu van|goi y|ke hoach|lam sao|cach |huong dan|ra sao|the nao|\b(?:nhap|them|sua|xoa|quet)\b/.test(q)) return false;
  const hasFinance = /thu chi|chi tieu|chi bao nhieu|tong chi|tong thu|thu nhap|so du|ngan sach|tai chinh|giao dich/.test(q);
  const hasPeriod = /thang truoc|thang sau|nam ngoai|\b(?:thang|t)\s*(?:1[0-2]|0?[1-9])\b|\b(?:19|20)\d{2}\b|toan bo|tat ca|toan thoi gian|lich su|cac nam/.test(q);
  return hasFinance && hasPeriod;
}

function trangThaiChatbot(req, res) {
  const { sanSang, model } = cauHinhAI();
  res.set('Cache-Control', 'no-store');
  return res.json({ aiSanSang: sanSang, model, duLieuSanSang: true, ragSanSang: true, coCheRag: 'hybrid-bm25-vector-64d-verified' });
}
async function guiTinNhan(req, res) {
  res.set('Cache-Control', 'no-store');
  const { tinNhan, lichSu = [], cheDo = 'du_lieu', dongYGuiAI, dungDuLieuCaNhan = false, dungAI = false } = req.body || {};
  if (typeof tinNhan !== 'string' || !tinNhan.trim() || tinNhan.length > CHATBOT.MAX_MESSAGE_LENGTH) return res.status(400).json({ message: 'Nhập câu hỏi từ 1 đến 2000 ký tự.' });
  if (!['auto', 'du_lieu', 'ai', 'tai_lieu'].includes(cheDo) || typeof dungDuLieuCaNhan !== 'boolean') return res.status(400).json({ message: 'Chế độ trò chuyện không hợp lệ.' });
  if (!Array.isArray(lichSu) || lichSu.length > CHATBOT.MAX_HISTORY_LENGTH || lichSu.some(t => !t || !['user', 'bot'].includes(t.vaiTro) || typeof t.noiDung !== 'string' || !t.noiDung.trim() || t.noiDung.length > CHATBOT.MAX_MESSAGE_LENGTH) || lichSu.reduce((n, t) => n + t.noiDung.length, 0) > CHATBOT.MAX_HISTORY_CHARACTERS) return res.status(400).json({ message: 'Lịch sử trò chuyện quá dài hoặc không hợp lệ. Hãy bắt đầu cuộc trò chuyện mới.' });
  try {
    if (cheDo === 'auto') {
      const rawTopics = timChuDe(tinNhan);
      const topics = rawTopics.length ? rawTopics : (isFinancePeriodQuery(tinNhan) ? ['taiChinh'] : []);
      if (topics.length) {
        const useAI = dungAI === true && dongYGuiAI === true && dungDuLieuCaNhan === true && cauHinhAI().sanSang;
        const data = useAI ? await layDuLieuSinhVien(req.user.id) : await layDuLieuSinhVien(req.user.id, topics);
        if (useAI) {
          try {
            const answer = await hoiGemini({ tinNhan: tinNhan.trim(), lichSu, duLieu: data });
            return res.json({ ...answer, nguon: 'ai', coDuLieuCaNhan: true, capNhatLuc: data.capNhatLuc });
          } catch (error) {
            if (typeof error.code !== 'string' || !error.code.startsWith('CHATBOT_')) throw error;
            // Known facts remain available if the provider is slow or quota is exhausted.
            const selected = { ...data, hocTap: topics.includes('hocTap') ? data.hocTap : undefined, deadline: topics.includes('deadline') ? data.deadline : undefined, taiChinh: topics.includes('taiChinh') ? data.taiChinh : undefined, lichHoc: topics.includes('lichHoc') ? data.lichHoc : undefined };
            return res.json({ nguon: 'du_lieu', traLoi: traLoiDuLieu(selected, tinNhan) + '\nAI tạm không phản hồi; đây là kết quả tra cứu trực tiếp.', capNhatLuc: data.capNhatLuc });
          }
        }
        return res.json({ nguon: 'du_lieu', traLoi: traLoiDuLieu(data, tinNhan), capNhatLuc: data.capNhatLuc });
      }
      const document = await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI: false, dongYGuiAI: false });
      if (document.thamKhao?.length) {
        if (dungAI === true && dongYGuiAI === true && cauHinhAI().sanSang) {
          const ragAnswer = await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI: true, dongYGuiAI: true });
          if (ragAnswer.ketQua === 'tra_loi') return res.json(ragAnswer);
        } else {
          return res.json(document);
        }
      }
      if (!cauHinhAI().sanSang || dongYGuiAI !== true) return res.json({ nguon: 'tai_lieu', traLoi: document.traLoi + (cauHinhAI().sanSang ? ' Nếu muốn nhận gợi ý từ AI, bạn có thể bật trong Tùy chọn trợ lý.' : ' Hiện tư vấn AI chưa được bật; tra cứu dữ liệu và tài liệu vẫn dùng được.'), thamKhao: [] });
      const data = dungDuLieuCaNhan ? await layDuLieuSinhVien(req.user.id) : null;
      const answer = await hoiGemini({ tinNhan: tinNhan.trim(), lichSu, duLieu: data });
      return res.json({ ...answer, nguon: 'ai', coDuLieuCaNhan: dungDuLieuCaNhan, capNhatLuc: data?.capNhatLuc });
    }
    if (cheDo === 'tai_lieu') return res.json(await answerDocumentQuestion(req.user.id, tinNhan.trim(), { dungAI, dongYGuiAI }));
    if (cheDo === 'du_lieu') {
      const rawTopics = timChuDe(tinNhan);
      const topics = rawTopics.length ? rawTopics : (isFinancePeriodQuery(tinNhan) ? ['taiChinh'] : []);
      if (!topics.length) return res.json({ nguon: 'du_lieu', traLoi: 'Mình tra cứu được GPA, deadline quá hạn và 7 ngày tới, thu/chi (tháng này, các tháng trước, từng năm và toàn bộ thời gian), lịch học hôm qua, hôm nay, ngày mai và tuần trước/này/sau. Để tư vấn hoặc lập kế hoạch, bật AI trong Tùy chọn trợ lý.' });
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
    if (typeof error.code === 'string' && error.code.startsWith('CHATBOT_')) return res.status(error.statusCode).json({ code: error.code, message: error.message });
    return res.status(503).json({ code: 'CHATBOT_DATA', message: 'Chưa đọc được dữ liệu của bạn. Hãy thử lại sau; mình chưa gửi câu hỏi đến AI.' });
  }
}
module.exports = { guiTinNhan, trangThaiChatbot };
