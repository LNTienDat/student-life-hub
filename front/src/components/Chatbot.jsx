import { useState, useRef, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import DocumentSources from './DocumentSources';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { chatbotHistory } from '../services/chatbotHistory';

const GOI_Y = {
  du_lieu: ['GPA hiện tại của mình?', 'Deadline sắp tới?', 'Tháng này chi bao nhiêu?', 'Hôm nay học gì?'],
  tai_lieu: ['LifeHub tính GPA như thế nào?', 'Nhập thời khóa biểu từ ảnh ra sao?'],
  ai: ['Gợi ý cách ôn thi hiệu quả', 'Giúp mình lập kế hoạch học trong tuần'],
};
const LOI_CHAO = { vaiTro: 'bot', noiDung: 'Bạn muốn xem GPA, deadline, thu/chi hay lịch học? Chọn một câu bên dưới để bắt đầu.' };

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
  const [cheDo, setCheDo] = useState('du_lieu');
  const [tinNhans, setTinNhans] = useState([LOI_CHAO]);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const [taiTrangThai, setTaiTrangThai] = useState(0);
  const [dongY, setDongY] = useState(false);
  const [dungDuLieu, setDungDuLieu] = useState(false);
  const [dungAIRag, setDungAIRag] = useState(false);
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
  }, [moChat, taiTrangThai]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (moChat) daMo.current = true;
    else if (daMo.current) {
      launcherRef.current?.focus({ preventScroll: true });
      daMo.current = false;
    }
  }, [moChat]);

  function batDauMoi(mode = cheDo) {
    requestRef.current?.abort(); requestRef.current = null;
    setDangGui(false); setLoi(null); setNoiDungNhap('');
    setTinNhans([mode === 'du_lieu' ? LOI_CHAO : mode === 'tai_lieu' ? { vaiTro: 'bot', noiDung: 'Hỏi rõ nội dung bạn muốn tìm trong tài liệu. Mình sẽ tìm các đoạn liên quan và hiển thị nguồn để bạn kiểm tra.' } : { vaiTro: 'bot', noiDung: 'Mình có thể gợi ý cách học, lập kế hoạch và quản lý chi tiêu. Câu trả lời AI có thể sai; bạn hãy kiểm tra trước khi áp dụng.' }]);
  }
  function doiCheDo(mode) {
    if (mode === cheDo) return;
    batDauMoi(mode); setCheDo(mode); setDongY(false); setDungDuLieu(false); setDungAIRag(false);
  }
  const coTheGui = cheDo === 'du_lieu' || (cheDo === 'tai_lieu' && !dungAIRag) || (trangThai?.aiSanSang && dongY);

  async function guiTinNhan(text) {
    const content = text.trim();
    if (!content || content.length > 2000 || requestRef.current || !coTheGui) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const lichSu = cheDo === 'ai' ? chatbotHistory(tinNhans) : [];
    const truoc = tinNhans;
    setTinNhans([...truoc, { vaiTro: 'user', noiDung: content, cheDo }]);
    setNoiDungNhap(''); setDangGui(true); setLoi(null);
    try {
      const res = await api.post('/chatbot/hoi-dap', {
        tinNhan: content, lichSu, cheDo, dongYGuiAI: dongY, dungDuLieuCaNhan: dungDuLieu, dungAI: dungAIRag,
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
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40">
      {moChat && (
        <section id={dialogId} role="dialog" aria-labelledby={titleId} className="flex flex-col w-[calc(100vw-1.5rem)] sm:w-[420px] h-[640px] max-h-[calc(100dvh-2rem)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden">
          <header className="flex shrink-0 items-center gap-2 px-4 py-2 border-b dark:border-gray-700">
            <MessageCircle size={20} aria-hidden="true" />
            <h2 id={titleId} className="font-semibold flex-1">Trợ lý LifeHub</h2>
            <button type="button" onClick={() => batDauMoi()} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cuộc trò chuyện mới" title="Cuộc trò chuyện mới"><RotateCcw size={18} /></button>
            <button type="button" onClick={() => setMoChat(false)} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Đóng trợ lý"><X size={20} /></button>
          </header>
          <div className="grid shrink-0 grid-cols-3 gap-1 m-3 mb-0 rounded-xl bg-gray-100 dark:bg-gray-900 p-1" role="group" aria-label="Chế độ trợ lý">
            {[['du_lieu', 'Xem dữ liệu'], ['tai_lieu', 'Hỏi tài liệu'], ['ai', 'Hỏi AI']].map(([mode, label]) => (
              <button key={mode} type="button" aria-pressed={cheDo === mode} onClick={() => doiCheDo(mode)} className={'min-h-11 rounded-lg text-sm font-medium ' + (cheDo === mode ? 'bg-white dark:bg-ink-600 shadow-sm' : 'text-gray-600 dark:text-gray-300')}>{label}</button>
            ))}
          </div>
          <div className="min-h-0 max-h-[35%] shrink overflow-y-auto overscroll-contain">
          {cheDo === 'du_lieu' ? (
            <p className="px-4 pt-2 text-xs text-gray-500 dark:text-gray-400">Tra cứu trực tiếp từ LifeHub, không gửi đến AI.</p>
          ) : cheDo === 'tai_lieu' ? (
            <div className="px-4 pt-2 text-xs">
              <Link to="/tai-lieu" onClick={() => setMoChat(false)} className="inline-flex min-h-11 items-center font-semibold text-ink-600 underline dark:text-ink-200">Quản lý tài liệu</Link>
              <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={dungAIRag} disabled={!trangThai?.aiSanSang} onChange={e => { batDauMoi(); setDungAIRag(e.target.checked); setDongY(false); }} className="h-4 w-4" />Nhờ AI giải thích kèm nguồn</label>
              {!trangThai?.aiSanSang && <p className="mb-2 text-gray-500 dark:text-gray-300">AI chưa sẵn sàng; tìm và đọc tài liệu vẫn dùng được.</p>}
              {dungAIRag && <label className="flex min-h-11 items-start gap-2"><input type="checkbox" checked={dongY} onChange={e => { batDauMoi(); setDongY(e.target.checked); }} className="mt-1 h-4 w-4 shrink-0" /><span>Tôi đồng ý gửi câu hỏi và các đoạn tài liệu liên quan đến Google. Với gói miễn phí, nội dung có thể được dùng để cải thiện sản phẩm.</span></label>}
            </div>
          ) : (
            <div className="px-4 pt-3 text-xs space-y-2">
              {!trangThai ? <p role="status">Đang kiểm tra kết nối AI…</p> : !trangThai.aiSanSang && (
                <div className="rounded-lg bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 p-2">
                  {trangThai.loi ? 'Chưa kiểm tra được kết nối.' : 'AI chưa được bật. Chủ dự án cần cấu hình khóa Gemini Free ở máy chủ.'}
                  <button type="button" className="block underline min-h-11" onClick={() => { setTrangThai(null); setTaiTrangThai(n => n + 1); }}>Kiểm tra lại</button>
                </div>
              )}
              <label className="flex gap-2 items-start cursor-pointer min-h-11">
                <input type="checkbox" checked={dongY} onChange={e => { batDauMoi(); setDongY(e.target.checked); }} className="mt-1 w-4 h-4 shrink-0" />
                <span>Tôi đồng ý gửi câu hỏi và hội thoại AI đến Google. Với gói miễn phí, nội dung có thể được dùng để cải thiện sản phẩm.</span>
              </label>
              <label className="flex gap-2 items-center cursor-pointer min-h-11">
                <input type="checkbox" checked={dungDuLieu} onChange={e => { batDauMoi(); setDungDuLieu(e.target.checked); }} className="w-4 h-4 shrink-0" />
                <span>Kèm tóm tắt GPA, deadline, thu/chi và lịch học của tôi.</span>
              </label>
            </div>
          )}
          </div>
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
              {GOI_Y[cheDo].map(text => <button key={text} type="button" disabled={!coTheGui} onClick={() => guiTinNhan(text)} className="min-h-11 rounded-xl border border-ink-200 dark:border-gray-600 px-3 text-xs text-ink-700 dark:text-ink-200 disabled:opacity-50">{text}</button>)}
            </div>}
            {dangGui && <div role="status" className="text-sm text-gray-500 dark:text-gray-300">
              {cheDo === 'ai' || dungAIRag ? 'Đang chờ AI trả lời…' : cheDo === 'tai_lieu' ? 'Đang tìm trong tài liệu…' : 'Đang đọc dữ liệu…'}
              <button type="button" className="underline block min-h-11" onClick={() => { requestRef.current?.abort(); requestRef.current = null; setDangGui(false); setTinNhans(t => t.slice(0, -1)); }}>Dừng chờ</button>
            </div>}
            {loi && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 text-sm">
              <p>{loi.message}</p><button type="button" onClick={() => guiTinNhan(loi.text)} className="underline min-h-11">Thử lại câu hỏi</button>
            </div>}
          </div>
          <form onSubmit={e => { e.preventDefault(); guiTinNhan(noiDungNhap); }} className="shrink-0 border-t dark:border-gray-700 p-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">Câu hỏi cho trợ lý</label>
            <input id={inputId} ref={inputRef} type="text" value={noiDungNhap} onChange={e => setNoiDungNhap(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }} maxLength={2000} disabled={dangGui} autoComplete="off" placeholder={cheDo === 'tai_lieu' ? 'Hỏi rõ nội dung trong tài liệu…' : cheDo === 'ai' ? 'Hỏi cách học, lập kế hoạch…' : 'Hỏi về dữ liệu của bạn…'} className="min-w-0 flex-1 min-h-11 rounded-xl border dark:border-gray-600 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400" />
            <button type="submit" disabled={dangGui || !coTheGui || !noiDungNhap.trim()} aria-label="Gửi tin nhắn" className="w-11 h-11 shrink-0 rounded-xl bg-ink-600 text-white flex items-center justify-center disabled:opacity-40"><Send size={19} /></button>
          </form>
        </section>
      )}
      {!moChat && <button ref={launcherRef} type="button" onClick={() => setMoChat(true)} className="w-14 h-14 rounded-full bg-ink-600 dark:bg-ink-500 text-white shadow-xl flex items-center justify-center" aria-label="Mở trợ lý LifeHub" aria-haspopup="dialog" aria-expanded={moChat} aria-controls={dialogId}><MessageCircle size={25} /></button>}
    </div>
  );
}
export default Chatbot;
