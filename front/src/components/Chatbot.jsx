import { useState, useRef, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import DocumentSources from './DocumentSources';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { chatbotHistory } from '../services/chatbotHistory';

const GOI_Y = ['GPA hiện tại của mình?', 'Deadline sắp tới?', 'Tháng này chi bao nhiêu?', 'Hôm nay học gì?', 'Nhập thời khóa biểu từ ảnh ra sao?'];
const LOI_CHAO = { vaiTro: 'bot', noiDung: 'Bạn cứ hỏi về học tập, deadline, thu chi hoặc lịch học. Mình sẽ tra cứu dữ liệu và tìm tài liệu phù hợp ngay trong cuộc trò chuyện này.' };

// Text is escaped by React. Never render model output as HTML or execute links.
function renderMarkdown(text) {
  return text.split('\n').map((line, i) => (
    <p key={i} className="my-1 whitespace-pre-wrap">
      {line.split(/(\*\*.*?\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}
    </p>
  ));
}

function Chatbot() {
  const [moChat, setMoChat] = useState(false);
  const [tinNhans, setTinNhans] = useState([LOI_CHAO]);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const [dongY, setDongY] = useState(false);
  const [dungDuLieu, setDungDuLieu] = useState(false);
  const danhSachRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const daMo = useRef(false);
  const requestRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    if (moChat && danhSachRef.current) danhSachRef.current.scrollTop = danhSachRef.current.scrollHeight;
  }, [tinNhans, moChat, dangGui, loi]);

  useEffect(() => {
    if (!moChat) return undefined;
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    const statusRequest = new AbortController();
    api.get('/chatbot/trang-thai', { signal: statusRequest.signal })
      .then(res => setTrangThai(res.data)).catch(error => { if (error.code !== 'ERR_CANCELED') setTrangThai({ loi: true }); });
    function keydown(event) {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[aria-modal="true"]')) {
        event.preventDefault(); setMoChat(false);
      }
    }
    window.addEventListener('keydown', keydown);
    return () => {
      cancelAnimationFrame(frame); statusRequest.abort(); requestRef.current?.abort();
      window.removeEventListener('keydown', keydown);
    };
  }, [moChat]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (moChat) daMo.current = true;
    else if (daMo.current) {
      launcherRef.current?.focus({ preventScroll: true });
      daMo.current = false;
    }
  }, [moChat]);

  function batDauMoi() {
    requestRef.current?.abort(); requestRef.current = null;
    setDangGui(false); setLoi(null); setNoiDungNhap(''); setTinNhans([LOI_CHAO]);
  }

  async function guiTinNhan(text) {
    const content = text.trim();
    if (!content || content.length > 2000 || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const lichSu = chatbotHistory(tinNhans);
    const truoc = tinNhans;
    setTinNhans([...truoc, { vaiTro: 'user', noiDung: content, cheDo: 'auto' }]);
    setNoiDungNhap(''); setDangGui(true); setLoi(null);
    try {
      const res = await api.post('/chatbot/hoi-dap', {
        tinNhan: content, lichSu, cheDo: 'auto', dongYGuiAI: dongY, dungDuLieuCaNhan: dungDuLieu, dungAI: dongY,
      }, { signal: controller.signal, timeout: 25000 });
      if (!controller.signal.aborted) setTinNhans(prev => [...prev, { vaiTro: 'bot', noiDung: res.data.traLoi, ...res.data }]);
    } catch (error) {
      if (!controller.signal.aborted) {
        setTinNhans(truoc);
        setLoi({ text: content, message: error.response?.data?.message || 'Chưa nhận được câu trả lời. Hãy kiểm tra kết nối và thử lại.' });
      }
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setDangGui(false); }
    }
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 lg:bottom-5 lg:right-5 z-40">
      {moChat && (
        <section id={dialogId} role="dialog" aria-labelledby={titleId} className="flex flex-col w-[calc(100vw-1.5rem)] sm:w-[420px] h-[640px] max-h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-2rem)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden">
          <header className="flex shrink-0 items-center gap-2 px-4 py-2 border-b dark:border-gray-700">
            <MessageCircle size={20} aria-hidden="true" />
            <h2 id={titleId} className="font-semibold flex-1">Trợ lý LifeHub</h2>
            <button type="button" onClick={() => batDauMoi()} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cuộc trò chuyện mới" title="Cuộc trò chuyện mới"><RotateCcw size={18} /></button>
            <button type="button" onClick={() => setMoChat(false)} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Đóng trợ lý"><X size={20} /></button>
          </header>
          <details className="shrink-0 border-b border-gray-200 px-4 text-xs dark:border-gray-700">
            <summary className="min-h-11 cursor-pointer py-3 text-gray-500 dark:text-gray-300">Tùy chọn trợ lý</summary>
            <Link to="/tai-lieu" onClick={() => setMoChat(false)} className="inline-flex min-h-11 items-center font-semibold text-ink-600 underline dark:text-ink-200">Quản lý tài liệu</Link>
            {trangThai?.aiSanSang ? <>
              <label className="mb-2 flex min-h-11 items-start gap-2"><input type="checkbox" checked={dongY} onChange={e => { setDongY(e.target.checked); }} className="mt-1 h-4 w-4 shrink-0"/><span>Cho phép AI hỗ trợ khi cần. Câu hỏi, hội thoại AI và đoạn tài liệu liên quan sẽ gửi đến Google; gói miễn phí có thể dùng nội dung để cải thiện sản phẩm.</span></label>
              <label className="mb-2 flex min-h-11 items-center gap-2"><input type="checkbox" disabled={!dongY} checked={dungDuLieu} onChange={e => setDungDuLieu(e.target.checked)} className="h-4 w-4 shrink-0"/>Kèm tóm tắt dữ liệu cá nhân khi hỏi AI.</label>
            </> : <p className="pb-3 text-gray-500 dark:text-gray-300">Tư vấn AI chưa bật. Tra cứu dữ liệu và tài liệu vẫn dùng được.</p>}
          </details>
          <div ref={danhSachRef} role="log" aria-label="Cuộc trò chuyện với trợ lý" aria-live="polite" className="min-h-12 flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
            {tinNhans.map((tin, i) => (
              <div key={i} className={'flex ' + (tin.vaiTro === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[92%] break-words [overflow-wrap:anywhere] rounded-xl px-3 py-2 text-sm ' + (tin.vaiTro === 'user' ? 'bg-ink-600 text-white' : 'bg-gray-100 dark:bg-gray-700')}>
                  {tin.nguon && <div className="text-[11px] mb-1 text-gray-500 dark:text-gray-300">{tin.nguon === 'rag' ? 'AI dựa trên tài liệu' : tin.nguon === 'tai_lieu' ? 'Tra cứu tài liệu' : tin.nguon === 'ai' ? 'Gợi ý từ AI' : 'Dữ liệu LifeHub'}{tin.capNhatLuc && ' · ' + new Date(tin.capNhatLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>}
                  {tin.vaiTro === 'bot' ? renderMarkdown(tin.noiDung) : tin.noiDung}
                  <DocumentSources sources={tin.thamKhao} onOpen={() => setMoChat(false)} />
                  {tin.biRutGon && <p className="mt-2 text-xs">Câu trả lời đã rút gọn. Bạn có thể hỏi tiếp từng ý.</p>}
                </div>
              </div>
            ))}
            {tinNhans.length === 1 && <div className="flex flex-wrap gap-2">
              {GOI_Y.map(text => <button key={text} type="button" onClick={() => guiTinNhan(text)} className="min-h-11 rounded-xl border border-ink-200 dark:border-gray-600 px-3 text-xs text-ink-700 dark:text-ink-200 disabled:opacity-50">{text}</button>)}
            </div>}
            {dangGui && <div role="status" className="text-sm text-gray-500 dark:text-gray-300">
              Đang tìm câu trả lời…
              <button type="button" className="underline block min-h-11" onClick={() => { requestRef.current?.abort(); requestRef.current = null; setDangGui(false); setTinNhans(t => t.slice(0, -1)); }}>Dừng chờ</button>
            </div>}
            {loi && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 text-sm">
              <p>{loi.message}</p><button type="button" onClick={() => guiTinNhan(loi.text)} className="underline min-h-11">Thử lại câu hỏi</button>
            </div>}
          </div>
          <form onSubmit={e => { e.preventDefault(); guiTinNhan(noiDungNhap); }} className="shrink-0 border-t dark:border-gray-700 p-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">Câu hỏi cho trợ lý</label>
            <input id={inputId} ref={inputRef} type="text" value={noiDungNhap} onChange={e => setNoiDungNhap(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }} maxLength={2000} disabled={dangGui} autoComplete="off" placeholder="Hỏi trợ lý LifeHub…" className="min-w-0 flex-1 min-h-11 rounded-xl border dark:border-gray-600 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400" />
            <button type="submit" disabled={dangGui || !noiDungNhap.trim()} aria-label="Gửi tin nhắn" className="w-11 h-11 shrink-0 rounded-xl bg-ink-600 text-white flex items-center justify-center disabled:opacity-40"><Send size={19} /></button>
          </form>
        </section>
      )}
      {!moChat && <button ref={launcherRef} type="button" onClick={() => setMoChat(true)} className="w-14 h-14 rounded-full bg-ink-600 dark:bg-ink-500 text-white shadow-xl flex items-center justify-center" aria-label="Mở trợ lý LifeHub" aria-haspopup="dialog" aria-expanded={moChat} aria-controls={dialogId}><MessageCircle size={25} /></button>}
    </div>
  );
}
export default Chatbot;
