import { t as tr, getLocale } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useState, useRef, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import DocumentSources from './DocumentSources';
import { MessageCircle, X, Send, RotateCcw, FileText } from 'lucide-react';
import api from '../services/api';
import { chatbotHistory } from '../services/chatbotHistory';

const GOI_Y = [
  'Hôm nay học gì & deadline sắp tới?',
  'Giúp mình lập kế hoạch học tuần này',
  'Tháng này chi tiêu bao nhiêu?',
  'Tư vấn cách ôn thi đại học & chọn ngành',
  'Cách tính điểm GPA theo quy chế?',
];
const LOI_CHAO = { vaiTro: 'bot', noiDung: 'Chào bạn! Mình có thể tra cứu lịch học, deadline, thu chi, giải đáp quy định từ tài liệu tải lên hoặc tư vấn kế hoạch, định hướng học tập bằng AI. Bạn cần mình hỗ trợ gì nào?' };

// Text is escaped by React. Never render model output as HTML or execute links.
function renderMarkdown(text) {
  return text.split('\n').map((line, i) => (
    <p key={i} className="my-1 whitespace-pre-wrap">
      {line.split(/(\*\*.*?\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}
    </p>
  ));
}

function Chatbot({ userId }) {
  useLanguage();
  const [moChat, setMoChat] = useState(false);
  const [tinNhans, setTinNhans] = useState([LOI_CHAO]);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const consentKey = userId == null ? null : `slh:chatbot-ai-consent:${userId}`;
  const [quyenAI, setQuyenAI] = useState(() => {
    try {
      const stored = consentKey === null ? null : localStorage.getItem(consentKey);
      if (stored === null) return 'with-data';
      return stored === 'off' ? null : stored;
    } catch {
      return 'with-data';
    }
  });
  const dungDuLieu = quyenAI === 'with-data';
  const dongY = quyenAI === 'yes' || dungDuLieu;
  const danhSachRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const daMo = useRef(false);
  const requestRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();
  const inputId = useId();

  function doiDongY(value) {
    setQuyenAI(value);
    if (consentKey === null) return;
    try {
      if (value) localStorage.setItem(consentKey, value);
      else localStorage.setItem(consentKey, 'off');
    } catch { /* The choice still applies to the current session. */ }
  }

  useEffect(() => {
    if (consentKey === null) return;
    function dongBoDongY(event) {
      if (event.storageArea !== localStorage || (event.key !== consentKey && event.key !== null)) return;
      setQuyenAI(event.newValue);
    }
    window.addEventListener('storage', dongBoDongY);
    return () => window.removeEventListener('storage', dongBoDongY);
  }, [consentKey]);

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
          <header className="flex shrink-0 items-center gap-1.5 px-4 py-2 border-b dark:border-gray-700">
            <MessageCircle size={20} aria-hidden="true" className="shrink-0 text-ink-600 dark:text-ink-300" />
            <h2 id={titleId} className="font-semibold flex-1 truncate text-sm sm:text-base">{tr("Trợ lý LifeHub")}</h2>
            <Link
              to="/tai-lieu"
              onClick={() => setMoChat(false)}
              className="px-2 py-1.5 rounded-lg text-ink-600 hover:text-ink-700 dark:text-ink-300 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-1 text-xs font-medium transition-colors"
              title={tr("Mở kho tài liệu")}
            >
              <FileText size={15} />
              <span className="hidden sm:inline">{tr("Tài liệu")}</span>
            </Link>
            <button type="button" onClick={() => batDauMoi()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={tr("Cuộc trò chuyện mới")} title={tr("Cuộc trò chuyện mới")}><RotateCcw size={16} /></button>
            <button type="button" onClick={() => setMoChat(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={tr("Đóng trợ lý")}><X size={18} /></button>
          </header>
          <details className="shrink-0 border-b border-gray-200 px-4 text-xs dark:border-gray-700">
            <summary className="min-h-11 cursor-pointer py-3 text-gray-500 dark:text-gray-300">{tr("Tùy chọn trợ lý")}</summary>
            <Link to="/tai-lieu" onClick={() => setMoChat(false)} className="inline-flex min-h-11 items-center font-semibold text-ink-600 underline dark:text-ink-200">{tr("Quản lý tài liệu")}</Link>
            {trangThai?.aiSanSang ? <>
              <label className="mb-2 flex min-h-11 items-start gap-2"><input type="checkbox" checked={dongY} onChange={e => doiDongY(e.target.checked ? 'yes' : null)} className="mt-1 h-4 w-4 shrink-0"/><span>{tr("Cho phép AI hỗ trợ khi cần. Câu hỏi, hội thoại AI và đoạn tài liệu liên quan sẽ gửi đến Google; gói miễn phí có thể dùng nội dung để cải thiện sản phẩm.")}</span></label>
              <label className="mb-2 flex min-h-11 items-start gap-2"><input type="checkbox" disabled={!dongY} checked={dungDuLieu} onChange={e => doiDongY(e.target.checked ? 'with-data' : 'yes')} className="mt-1 h-4 w-4 shrink-0"/>{tr("Cho phép gửi tóm tắt lịch học, deadline, GPA và thu/chi đến Google để AI tư vấn khi cần.")}</label>
            </> : <p className="pb-3 text-gray-500 dark:text-gray-300">{tr("Tư vấn AI chưa bật. Tra cứu dữ liệu và tài liệu vẫn dùng được.")}</p>}
          </details>
          <div ref={danhSachRef} role="log" aria-label={tr("Cuộc trò chuyện với trợ lý")} aria-live="polite" className="min-h-12 flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
            {tinNhans.map((tin, i) => (
              <div key={i} className={'flex ' + (tin.vaiTro === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[92%] break-words [overflow-wrap:anywhere] rounded-xl px-3 py-2 text-sm ' + (tin.vaiTro === 'user' ? 'bg-ink-600 text-white' : 'bg-gray-100 dark:bg-gray-700')}>
                  {tin.nguon && <div className="text-[11px] mb-1 text-gray-500 dark:text-gray-300">{tin.nguon === 'rag' ? tr('AI dựa trên tài liệu') : tin.nguon === 'tai_lieu' ? tr('Tra cứu tài liệu') : tin.nguon === 'ai' ? tr('Gợi ý từ AI') : tr('Dữ liệu LifeHub')}{tin.capNhatLuc && ' · ' + new Date(tin.capNhatLuc).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}</div>}
                  {tin.vaiTro === 'bot' ? renderMarkdown(tin === LOI_CHAO ? tr(tin.noiDung) : tin.noiDung) : tin.noiDung}
                  <DocumentSources sources={tin.thamKhao} onOpen={() => setMoChat(false)} />
                  {tin.biRutGon && <p className="mt-2 text-xs">{tr("Câu trả lời đã rút gọn. Bạn có thể hỏi tiếp từng ý.")}</p>}
                </div>
              </div>
            ))}
            {tinNhans.length === 1 && <div className="flex flex-wrap gap-2">
              {GOI_Y.map(text => <button key={text} type="button" onClick={() => guiTinNhan(text)} className="min-h-11 rounded-xl border border-ink-200 dark:border-gray-600 px-3 text-xs text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">{tr(text)}</button>)}
            </div>}
            {dangGui && <div role="status" className="text-sm text-gray-500 dark:text-gray-300">{tr("Đang tìm câu trả lời…")}<button type="button" className="underline block min-h-11" onClick={() => { requestRef.current?.abort(); requestRef.current = null; setDangGui(false); setTinNhans(t => t.slice(0, -1)); }}>{tr("Dừng chờ")}</button>
            </div>}
            {loi && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 text-sm">
              <p>{tr(loi.message)}</p><button type="button" onClick={() => guiTinNhan(loi.text)} className="underline min-h-11">{tr("Thử lại câu hỏi")}</button>
            </div>}
          </div>
          <form onSubmit={e => { e.preventDefault(); guiTinNhan(noiDungNhap); }} className="shrink-0 border-t dark:border-gray-700 p-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">{tr("Câu hỏi cho trợ lý")}</label>
            <input id={inputId} ref={inputRef} type="text" value={noiDungNhap} onChange={e => setNoiDungNhap(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }} maxLength={2000} disabled={dangGui} autoComplete="off" placeholder={tr("Hỏi trợ lý LifeHub…")} className="min-w-0 flex-1 min-h-11 rounded-xl border dark:border-gray-600 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400" />
            <button type="submit" disabled={dangGui || !noiDungNhap.trim()} aria-label={tr("Gửi tin nhắn")} className="w-11 h-11 shrink-0 rounded-xl bg-ink-600 text-white flex items-center justify-center disabled:opacity-40"><Send size={19} /></button>
          </form>
        </section>
      )}
      {!moChat && <button ref={launcherRef} type="button" onClick={() => setMoChat(true)} className="w-14 h-14 rounded-full bg-ink-600 dark:bg-ink-500 text-white shadow-xl flex items-center justify-center" aria-label={tr("Mở trợ lý LifeHub")} aria-haspopup="dialog" aria-expanded={moChat} aria-controls={dialogId}><MessageCircle size={25} /></button>}
    </div>
  );
}
export default Chatbot;
