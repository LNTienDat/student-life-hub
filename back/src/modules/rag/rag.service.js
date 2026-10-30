const { searchableDocuments } = require('./document.service');
const { retrieve, verifiedAnswer } = require('./rag.text');
const { cauHinhAI, hoiGemini } = require('../chatbot/gemini.service');
const { httpError } = require('../../utils/transaction.util');
async function answerDocumentQuestion(idNguoiDung, question, { dungAI = false, dongYGuiAI = false } = {}) {
  if (typeof dungAI !== 'boolean') throw httpError(400, 'Lựa chọn giải thích bằng AI không hợp lệ.');
  if (dungAI && dongYGuiAI !== true) throw httpError(400, 'Cần đồng ý gửi câu hỏi và các đoạn tài liệu liên quan đến Google trước khi dùng AI.');
  if (dungAI && !cauHinhAI().sanSang) throw Object.assign(httpError(503, 'AI chưa được bật. Bạn vẫn có thể tìm và đọc tài liệu miễn phí.'), { code: 'CHATBOT_NOT_CONFIGURED' });
  const sources = retrieve(await searchableDocuments(idNguoiDung), question);
  if (!sources.length) return { nguon: 'tai_lieu', ketQua: 'khong_tim_thay', traLoi: 'Chưa tìm thấy nội dung phù hợp trong kho tài liệu. Bạn hãy bổ sung tài liệu hoặc hỏi cụ thể hơn; mình chưa có đủ căn cứ để trả lời.', thamKhao: [] };
  if (!dungAI) return { nguon: 'tai_lieu', ketQua: 'trich_doan', traLoi: 'Tìm thấy các đoạn liên quan bên dưới. Đây là trích đoạn nguyên văn để bạn đối chiếu, chưa phải câu trả lời do AI diễn giải.', thamKhao: sources };
  const answer = await hoiGemini({ tinNhan: question, lichSu: [], trichDoan: sources });
  const verified = !answer.biRutGon && verifiedAnswer(answer.traLoi, sources);
  if (!verified) return { nguon: 'tai_lieu', ketQua: 'khong_xac_minh_duoc', traLoi: 'AI chưa trả về câu trả lời có dẫn nguồn hợp lệ. Bạn có thể đọc các đoạn gốc bên dưới và thử hỏi lại cụ thể hơn.', thamKhao: sources };
  return { nguon: 'rag', ketQua: verified.duThongTin ? 'tra_loi' : 'chua_du_thong_tin', traLoi: verified.traLoi, thamKhao: verified.thamKhao, model: answer.model };
}
module.exports = { answerDocumentQuestion };
