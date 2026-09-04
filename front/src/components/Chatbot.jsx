import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

function Chatbot() {
  const [moChat, setMoChat] = useState(false);
  const [tinNhans, setTinNhans] = useState([
    { vaiTro: 'bot', noiDung: 'Chào bạn! Mình là SLH Bot 🤖. Bạn cần hỏi gì về học tập, deadline, tài chính hay cách dùng app không?' },
  ]);
  const [dangGui, setDangGui] = useState(false);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const cuoiDanhSachRef = useRef(null);

  useEffect(() => {
    if (moChat) {
      cuoiDanhSachRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tinNhans, moChat]);

  async function xuLyGui(e) {
    e.preventDefault();
    const noiDung = noiDungNhap.trim();
    if (!noiDung || dangGui) return;

    const tinNhanMoi = { vaiTro: 'user', noiDung };
    const lichSuHienTai = [...tinNhans, tinNhanMoi];
    setTinNhans(lichSuHienTai);
    setNoiDungNhap('');
    setDangGui(true);

    try {
      const res = await api.post('/chatbot/hoi-dap', {
        tinNhan: noiDung,
        lichSu: tinNhans, // gửi lịch sử trước đó (chưa gồm tin vừa nhập) làm ngữ cảnh
      });
      setTinNhans((prev) => [...prev, { vaiTro: 'bot', noiDung: res.data.traLoi }]);
    } catch (error) {
      setTinNhans((prev) => [
        ...prev,
        {
          vaiTro: 'bot',
          noiDung: error.response?.data?.message || 'Xin lỗi, mình đang gặp sự cố. Vui lòng thử lại sau.',
        },
      ]);
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {moChat && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-ink-600 dark:bg-ink-500 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm">🤖 SLH Bot</span>
            <button onClick={() => setMoChat(false)} className="hover:opacity-80">✕</button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tinNhans.map((tin, i) => (
              <div
                key={i}
                className={`flex ${tin.vaiTro === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    tin.vaiTro === 'user'
                      ? 'bg-ink-600 dark:bg-ink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {tin.noiDung}
                </div>
              </div>
            ))}
            {dangGui && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-lg px-3 py-2 text-sm italic">
                  Đang trả lời...
                </div>
              </div>
            )}
            <div ref={cuoiDanhSachRef} />
          </div>

          {/* Ô nhập */}
          <form onSubmit={xuLyGui} className="border-t dark:border-gray-700 p-2 flex gap-2">
            <input
              value={noiDungNhap}
              onChange={(e) => setNoiDungNhap(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
              disabled={dangGui}
            />
            <button
              type="submit"
              disabled={dangGui || !noiDungNhap.trim()}
              className="bg-ink-600 dark:bg-ink-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-ink-700 dark:hover:bg-ink-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 flex-shrink-0"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Nút bong bóng nổi */}
      <button
        onClick={() => setMoChat(!moChat)}
        className="w-14 h-14 rounded-full bg-ink-600 dark:bg-ink-500 text-white text-2xl shadow-lg hover:bg-ink-700 dark:hover:bg-ink-600 flex items-center justify-center transition-transform hover:scale-105"
        title="Hỏi đáp nhanh"
      >
        {moChat ? '✕' : '💬'}
      </button>
    </div>
  );
}

export default Chatbot;
