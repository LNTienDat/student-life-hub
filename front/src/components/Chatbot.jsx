import { t as tr, getLocale } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useState, useRef, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import DocumentSources from './DocumentSources';
import AgentActionCard from './AgentActionCard';
import { MessageCircle, X, Send, RotateCcw, FileText, GripVertical, Mic, MicOff } from 'lucide-react';
import api from '../services/api';
import { chatbotHistory } from '../services/chatbotHistory';
import { createVoiceSession, isSpeechRecognitionSupported, mergeVoiceTranscript } from '../utils/speechRecognition';

const POS_STORAGE_KEY = 'slh:chatbot-pos';

function loadSavedPosition() {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.left === 'number' && Number.isFinite(parsed.left) && typeof parsed?.top === 'number' && Number.isFinite(parsed.top)) {
      return { left: parsed.left, top: parsed.top };
    }
  } catch { /* Ignore invalid saved position */ }
  return null;
}

function clampPosition(pos, width, height, viewport) {
  if (!pos) return null;
  const margin = 8;
  const maxLeft = Math.max(margin, viewport.width - width - margin);
  const maxTop = Math.max(margin, viewport.height - height - margin);
  return {
    left: Math.min(Math.max(margin, pos.left), maxLeft),
    top: Math.min(Math.max(margin, pos.top), maxTop),
  };
}

const GOI_Y = [
  'Hôm nay học gì & deadline sắp tới?',
  'Ghi chi 45k trà sữa hôm nay',
  'Tạo deadline nộp báo cáo ngày mai ưu tiên cao',
  'Giúp mình lập kế hoạch học tuần này',
  'Tháng này chi tiêu bao nhiêu?',
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
  const { language } = useLanguage();
  const [moChat, setMoChat] = useState(false);
  const [tinNhans, setTinNhans] = useState([LOI_CHAO]);
  const [noiDungNhap, setNoiDungNhap] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [coTinMoi, setCoTinMoi] = useState(false);
  const [loi, setLoi] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const [dangGhiAm, setDangGhiAm] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [pos, setPos] = useState(loadSavedPosition);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
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
  const wrapperRef = useRef(null);
  const daMo = useRef(false);
  const moChatRef = useRef(moChat);
  const requestRef = useRef(null);
  const voiceSessionRef = useRef(null);
  const dragRef = useRef(null);
  const dragCleanupRef = useRef(null);
  const movedRef = useRef(false);
  const dialogId = useId();
  const titleId = useId();
  const inputId = useId();
  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => { moChatRef.current = moChat; }, [moChat]);

  useEffect(() => {
    function onResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      setQuyenAI(event.newValue === null ? 'with-data' : event.newValue === 'off' ? null : event.newValue);
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
        event.preventDefault();
        voiceSessionRef.current?.abort();
        voiceSessionRef.current = null;
        setDangGhiAm(false);
        setMoChat(false);
      }
    }
    window.addEventListener('keydown', keydown);
    return () => {
      cancelAnimationFrame(frame); statusRequest.abort();
      window.removeEventListener('keydown', keydown);
    };
  }, [moChat]);
  useEffect(() => () => {
    requestRef.current?.abort();
    dragCleanupRef.current?.();
    voiceSessionRef.current?.abort();
  }, []);
  useEffect(() => {
    if (moChat) daMo.current = true;
    else if (daMo.current) {
      launcherRef.current?.focus({ preventScroll: true });
      daMo.current = false;
    }
  }, [moChat]);

  function openChat() {
    setMoChat(true);
    setCoTinMoi(false);
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragCleanupRef.current?.();
    const drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      width: rect.width,
      height: rect.height,
    };
    dragRef.current = drag;
    movedRef.current = false;
    let latestPos = null;

    function onMove(ev) {
      if (ev.pointerId !== drag.pointerId) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      if (!movedRef.current && Math.hypot(dx, dy) <= 5) return;
      movedRef.current = true;
      latestPos = clampPosition(
        { left: drag.startLeft + dx, top: drag.startTop + dy },
        drag.width,
        drag.height,
        { width: window.innerWidth, height: window.innerHeight }
      );
      setPos(latestPos);
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (dragCleanupRef.current === cleanup) dragCleanupRef.current = null;
    }

    function onEnd(ev) {
      if (ev.pointerId !== drag.pointerId) return;
      cleanup();
      dragRef.current = null;
      if (latestPos) {
        try { localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(latestPos)); } catch { /* Optional */ }
      }
    }

    dragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }

  function abortVoice() {
    voiceSessionRef.current?.abort();
    voiceSessionRef.current = null;
    setDangGhiAm(false);
  }

  function closeChat() {
    abortVoice();
    setMoChat(false);
  }

  function batDauMoi() {
    abortVoice();
    setVoiceError('');
    requestRef.current?.abort(); requestRef.current = null;
    setDangGui(false); setCoTinMoi(false); setLoi(null); setNoiDungNhap(''); setTinNhans([LOI_CHAO]);
  }

  function toggleVoice() {
    if (dangGhiAm || voiceSessionRef.current) {
      voiceSessionRef.current?.stop();
      return;
    }
    if (!speechSupported || dangGui) return;
    setVoiceError('');
    setDangGhiAm(true);
    const baseDraft = noiDungNhap;
    const session = createVoiceSession({
      lang: language === 'en' ? 'en-US' : 'vi-VN',
      onInterim: (transcript) => setNoiDungNhap(mergeVoiceTranscript(baseDraft, transcript)),
      onFinal: (transcript) => {
        setNoiDungNhap(mergeVoiceTranscript(baseDraft, transcript));
        requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      },
      onError: (msg) => setVoiceError(msg),
      onEnd: () => {
        setDangGhiAm(false);
        voiceSessionRef.current = null;
        requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      },
    });
    voiceSessionRef.current = session;
    session.start();
  }

  async function guiTinNhan(text) {
    abortVoice();
    setVoiceError('');
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
      if (!controller.signal.aborted) {
        setTinNhans(prev => [...prev, { vaiTro: 'bot', noiDung: res.data.traLoi, ...res.data }]);
        if (!moChatRef.current) setCoTinMoi(true);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setTinNhans(truoc);
        setLoi({ text: content, message: error.response?.data?.message || 'Chưa nhận được câu trả lời. Hãy kiểm tra kết nối và thử lại.' });
        if (!moChatRef.current) setCoTinMoi(true);
      }
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setDangGui(false); }
    }
  }

  const panelW = moChat ? (viewport.width >= 640 ? 420 : Math.max(280, viewport.width - 24)) : 56;
  const panelH = moChat ? Math.min(640, Math.max(320, viewport.height - 32)) : 56;
  const safePos = clampPosition(pos, panelW, panelH, viewport);

  return (
    <div
      ref={wrapperRef}
      style={safePos ? { left: safePos.left, top: safePos.top } : undefined}
      className={safePos ? 'fixed z-40' : 'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 lg:bottom-5 lg:right-5 z-40'}
    >
      {moChat && (
        <section id={dialogId} role="dialog" aria-labelledby={titleId} className="flex flex-col w-[calc(100vw-1.5rem)] sm:w-[420px] h-[640px] max-h-[calc(100dvh-2rem)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden">
          <header
            onPointerDown={startDrag}
            title={tr("Kéo để di chuyển khung trò chuyện")}
            className="flex shrink-0 cursor-move touch-none select-none items-center gap-1.5 px-3 py-2 border-b dark:border-gray-700"
          >
            <GripVertical size={16} aria-hidden="true" className="shrink-0 text-gray-400" />
            <MessageCircle size={20} aria-hidden="true" className="shrink-0 text-ink-600 dark:text-ink-300" />
            <h2 id={titleId} className="font-semibold flex-1 truncate text-sm sm:text-base">{tr("Trợ lý LifeHub")}</h2>
            <Link
              to="/tai-lieu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={closeChat}
              className="px-2 py-1.5 rounded-lg text-ink-600 hover:text-ink-700 dark:text-ink-300 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-1 text-xs font-medium transition-colors"
              title={tr("Mở kho tài liệu")}
            >
              <FileText size={15} />
              <span className="hidden sm:inline">{tr("Tài liệu")}</span>
            </Link>
            <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => batDauMoi()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={tr("Cuộc trò chuyện mới")} title={tr("Cuộc trò chuyện mới")}><RotateCcw size={16} /></button>
            <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={closeChat} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={tr("Đóng trợ lý")}><X size={18} /></button>
          </header>
          <details className="shrink-0 border-b border-gray-200 px-4 text-xs dark:border-gray-700">
            <summary className="min-h-11 cursor-pointer py-3 text-gray-500 dark:text-gray-300">{tr("Tùy chọn trợ lý")}</summary>
            <Link to="/tai-lieu" onClick={closeChat} className="inline-flex min-h-11 items-center font-semibold text-ink-600 underline dark:text-ink-200">{tr("Quản lý tài liệu")}</Link>
            {trangThai?.aiSanSang ? <>
              <label className="mb-2 flex min-h-11 items-start gap-2"><input type="checkbox" checked={dongY} onChange={e => doiDongY(e.target.checked ? 'yes' : null)} className="mt-1 h-4 w-4 shrink-0"/><span>{tr("Cho phép AI hỗ trợ khi cần. Câu hỏi, hội thoại AI và đoạn tài liệu liên quan sẽ gửi đến Google; gói miễn phí có thể dùng nội dung để cải thiện sản phẩm.")}</span></label>
              <label className="mb-2 flex min-h-11 items-start gap-2"><input type="checkbox" disabled={!dongY} checked={dungDuLieu} onChange={e => doiDongY(e.target.checked ? 'with-data' : 'yes')} className="mt-1 h-4 w-4 shrink-0"/>{tr("Cho phép gửi tóm tắt lịch học, deadline, GPA và thu/chi đến Google để AI tư vấn khi cần.")}</label>
            </> : <p className="pb-3 text-gray-500 dark:text-gray-300">{tr("Tư vấn AI chưa bật. Tra cứu dữ liệu và tài liệu vẫn dùng được.")}</p>}
          </details>
          <div ref={danhSachRef} role="log" aria-label={tr("Cuộc trò chuyện với trợ lý")} aria-live="polite" className="min-h-12 flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
            {tinNhans.map((tin, i) => (
              <div key={i} className={'flex ' + (tin.vaiTro === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[92%] break-words [overflow-wrap:anywhere] rounded-xl px-3 py-2 text-sm ' + (tin.vaiTro === 'user' ? 'bg-ink-600 text-white' : 'bg-gray-100 dark:bg-gray-700')}>
                  {tin.nguon && <div className="text-[11px] mb-1 text-gray-500 dark:text-gray-300">{tin.nguon === 'rag' ? tr('AI dựa trên tài liệu') : tin.nguon === 'tai_lieu' ? tr('Tra cứu tài liệu') : tin.nguon === 'ai' ? tr('Gợi ý từ AI') : tin.nguon === 'agent' ? tr('Đề xuất thao tác') : tr('Dữ liệu LifeHub')}{tin.capNhatLuc && ' · ' + new Date(tin.capNhatLuc).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}</div>}
                  {tin.vaiTro === 'bot' ? renderMarkdown(tin === LOI_CHAO ? tr(tin.noiDung) : tin.noiDung) : tin.noiDung}
                  {tin.hanhDong && <AgentActionCard action={tin.hanhDong} userId={userId} onNavigate={closeChat} />}
                  <DocumentSources sources={tin.thamKhao} onOpen={closeChat} />
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
          {voiceError && (
            <div role="status" className="shrink-0 mx-3 mb-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
              <span>{tr(voiceError)}</span>
              <button type="button" onClick={() => setVoiceError('')} className="p-0.5 text-amber-700 hover:text-amber-900 dark:text-amber-300" aria-label={tr("Đóng thông báo giọng nói")}>
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); guiTinNhan(noiDungNhap); }} className="shrink-0 border-t dark:border-gray-700 p-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">{tr("Câu hỏi cho trợ lý")}</label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={noiDungNhap}
              onChange={e => setNoiDungNhap(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }}
              maxLength={2000}
              disabled={dangGui}
              autoComplete="off"
              placeholder={dangGhiAm ? tr("Đang nghe… Hãy nói lệnh hoặc câu hỏi") : tr("Hỏi trợ lý LifeHub…")}
              className="min-w-0 flex-1 min-h-11 rounded-xl border dark:border-gray-600 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
            />
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!speechSupported || dangGui}
              aria-pressed={dangGhiAm}
              aria-label={dangGhiAm ? tr("Dừng ghi âm giọng nói") : tr("Ra lệnh bằng giọng nói")}
              title={!speechSupported ? tr("Trình duyệt chưa hỗ trợ nhập liệu giọng nói") : dangGhiAm ? tr("Dừng ghi âm") : tr("Nói để nhập nội dung")}
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 ${
                dangGhiAm
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {dangGhiAm ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button type="submit" disabled={dangGui || !noiDungNhap.trim()} aria-label={tr("Gửi tin nhắn")} className="w-11 h-11 shrink-0 rounded-xl bg-ink-600 text-white flex items-center justify-center disabled:opacity-40"><Send size={19} /></button>
          </form>
        </section>
      )}
      {!moChat && (
        <button
          ref={launcherRef}
          type="button"
          onPointerDown={startDrag}
          onClick={() => {
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            openChat();
          }}
          title={dangGui ? tr("Trợ lý đang trả lời… Kéo để di chuyển") : tr("Mở trợ lý LifeHub (kéo để di chuyển)")}
          className="relative w-14 h-14 cursor-grab active:cursor-grabbing touch-none rounded-full bg-ink-600 dark:bg-ink-500 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
          aria-label={tr("Mở trợ lý LifeHub")}
          aria-haspopup="dialog"
          aria-expanded={moChat}
          aria-controls={dialogId}
        >
          <MessageCircle size={25} />
          {dangGui && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-80" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400" />
            </span>
          )}
          {!dangGui && coTinMoi && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </button>
      )}
    </div>
  );
}
export default Chatbot;
