import { useState, useRef, useEffect, useMemo } from 'react';
import api from '../services/api';

// Các câu gợi ý nhanh cho người dùng
const GOI_Y_NHANH = [
  { icon: '📊', text: 'GPA hiện tại của mình?' },
  { icon: '📅', text: 'Deadline sắp tới?' },
  { icon: '💰', text: 'Tháng này chi bao nhiêu?' },
  { icon: '🗓️', text: 'Hôm nay học gì?' },
];

/**
 * Render markdown cơ bản: **bold**, *italic*, bullet list (- item), xuống dòng
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  function flushList() {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
          {currentList.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  }

  function formatInline(str) {
    // Bold: **text** → <strong>
    // Italic: *text* → <em>
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={match.index}>{match[3]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Bullet list items: "- item" hoặc "• item"
    if (/^[-•]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[-•]\s+/, ''));
      return;
    }

    flushList();

    if (trimmed === '') {
      // Dòng trống → khoảng cách nhỏ
      elements.push(<div key={`br-${i}`} className="h-1" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="my-0.5">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return elements;
}

function Chatbot() {
  const [moChat, setMoChat] = useState(false);
  const [tinNhans, setTinNhans] = useState([
    { vaiTro: 'bot', noiDung: 'Chào bạn! Mình là SLH Bot 🤖 — trợ lý cá nhân của bạn. Mình có thể xem GPA, deadline, tài chính và lịch học của bạn. Hỏi mình bất cứ gì nhé!' },
  ]);
  const [dangGui, setDangGui] = useState(false);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const cuoiDanhSachRef = useRef(null);

  // Chỉ hiển thị gợi ý nhanh khi chỉ có tin welcome ban đầu
  const hienGoiY = useMemo(() => tinNhans.length <= 1, [tinNhans]);

  useEffect(() => {
    if (moChat) {
      cuoiDanhSachRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tinNhans, moChat]);

  // Đóng chat khi bấm phím Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && moChat) {
        setMoChat(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moChat]);

  async function guiTinNhan(noiDung) {
    if (!noiDung || !noiDung.trim() || dangGui) return;

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

  function xuLyGui(e) {
    e.preventDefault();
    guiTinNhan(noiDungNhap.trim());
  }

  function xuLyGoiY(text) {
    guiTinNhan(text);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {moChat && (
        <div
          role="dialog"
          aria-label="Trợ lý ảo SLH Bot"
          className="w-80 sm:w-96 h-[32rem] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-ink-600 dark:bg-ink-500 text-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <span className="font-semibold text-sm">SLH Bot</span>
                <span className="text-xs opacity-80 ml-1.5">Trợ lý cá nhân</span>
              </div>
            </div>
            <button
              onClick={() => setMoChat(false)}
              className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white text-base font-bold"
              title="Đóng trợ lý ảo"
              aria-label="Đóng trợ lý ảo"
            >
              ✕
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tinNhans.map((tin, i) => (
              <div
                key={i}
                className={`flex ${tin.vaiTro === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    tin.vaiTro === 'user'
                      ? 'bg-ink-600 dark:bg-ink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {tin.vaiTro === 'bot' ? renderMarkdown(tin.noiDung) : tin.noiDung}
                </div>
              </div>
            ))}

            {/* Gợi ý nhanh */}
            {hienGoiY && !dangGui && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {GOI_Y_NHANH.map((gy) => (
                  <button
                    key={gy.text}
                    onClick={() => xuLyGoiY(gy.text)}
                    className="text-xs bg-ink-50 dark:bg-gray-700 text-ink-700 dark:text-ink-300 border border-ink-200 dark:border-gray-600 rounded-full px-3 py-1.5 hover:bg-ink-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {gy.icon} {gy.text}
                  </button>
                ))}
              </div>
            )}

            {dangGui && (
              <div className="flex justify-start" role="status" aria-label="Đang chờ phản hồi">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-lg px-3 py-2 text-sm italic flex items-center gap-2">
                  <span className="inline-flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  Đang phân tích...
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
              placeholder="Hỏi về GPA, deadline, tài chính..."
              aria-label="Nhập câu hỏi cho trợ lý ảo"
              className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
              disabled={dangGui}
            />
            <button
              type="submit"
              disabled={dangGui || !noiDungNhap.trim()}
              aria-label="Gửi tin nhắn"
              className="bg-ink-600 dark:bg-ink-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-ink-700 dark:hover:bg-ink-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 flex-shrink-0"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Nút bong bóng nổi - chỉ hiển thị khi chatbox đang đóng */}
      {!moChat && (
        <button
          onClick={() => setMoChat(true)}
          className="w-14 h-14 rounded-full bg-ink-600 dark:bg-ink-500 text-white text-2xl shadow-xl hover:bg-ink-700 dark:hover:bg-ink-600 flex items-center justify-center transition-all hover:scale-105"
          title="Hỏi đáp nhanh cùng SLH Bot"
          aria-label="Mở trợ lý ảo SLH Bot"
        >
          💬
        </button>
      )}
    </div>
  );
}

export default Chatbot;
