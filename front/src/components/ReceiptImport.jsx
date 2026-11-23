import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Sparkles } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { recognizeReceipt } from '../services/receiptImage';
import { fetchVisionOcrStatus, scanReceiptWithAI } from '../services/visionOcr';

export default function ReceiptImport({ open, onClose, onRecognized }) {
  useLanguage();
  const input = useRef(null), camera = useRef(null), controller = useRef(null), version = useRef(0);
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  const [phase, setPhase] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => () => { version.current++; controller.current?.abort(); }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchVisionOcrStatus().then((status) => {
      if (active) setAiAvailable(Boolean(status?.aiSanSang));
    }).catch(() => {
      if (active) setAiAvailable(false);
    });
    return () => { active = false; };
  }, [open]);

  function close() {
    version.current++;
    controller.current?.abort();
    setBusy(false);
    setPhase('');
    setMessage('');
    onClose();
  }

  async function read(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    controller.current?.abort();
    const run = ++version.current, abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setProgress(0);
    setPhase(aiAvailable ? 'ai' : '');
    setMessage('');
    const timer = setTimeout(() => abort.abort(), 120000);
    try {
      let result = null;
      let fallbackWarning = '';
      if (aiAvailable) {
        try {
          const ai = await scanReceiptWithAI(file, { signal: abort.signal });
          if (run !== version.current) return;
          result = { ...ai, aiUsed: true };
        } catch (aiErr) {
          if (abort.signal.aborted || run !== version.current) throw aiErr;
          const status = aiErr?.response?.status;
          if (status && status < 500 && status !== 429) throw aiErr;
          const aiMsg = aiErr?.response?.data?.message || aiErr?.message;
          fallbackWarning = aiMsg ? `AI Vision (${aiMsg}) — đã chuyển sang đọc trên thiết bị` : 'AI Vision tạm gián đoạn — đã chuyển sang đọc trên thiết bị';
          setPhase('');
        }
      }
      if (!result) {
        result = await recognizeReceipt(file, {
          signal: abort.signal,
          onProgress: (value) => { if (run === version.current) setProgress(value); },
        });
        if (run !== version.current) return;
        if (fallbackWarning) {
          result = { ...result, warnings: [...(result.warnings || []), fallbackWarning] };
        }
      }

      if (run !== version.current) return;
      onRecognized(result, file);
      onClose();
    } catch (error) {
      if (run === version.current) {
        const serverMessage = error?.response?.data?.message;
        setMessage(abort.signal.aborted ? 'Đã dừng đọc hóa đơn.' : serverMessage || error.message || 'Chưa đọc được hóa đơn.');
      }
    } finally {
      clearTimeout(timer);
      if (run === version.current) { setBusy(false); setPhase(''); }
    }
  }

  return (
    <ModalDialog open={open} onClose={close} title={tr("Quét hóa đơn")} closeLabel={busy ? tr('Dừng quét và đóng') : tr('Đóng')}>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {aiAvailable
          ? tr("Dùng AI Vision để đọc nhanh và chính xác ngay từ đầu; tự động chuyển về đọc trên thiết bị nếu mất kết nối.")
          : tr("Đọc ảnh trên thiết bị. Kiểm tra trước khi lưu.")}
      </p>

      {aiAvailable && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-medium text-indigo-800 dark:border-indigo-800/70 dark:bg-indigo-950/30 dark:text-indigo-200">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{tr("Đọc chính xác ảnh nghiêng, thiếu sáng hoặc chữ mờ")}</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white disabled:opacity-50 whitespace-nowrap ${aiAvailable ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-ink-600 hover:bg-ink-700'}`}
        >
          <ImagePlus className="h-4 w-4 shrink-0" />{tr("Chọn ảnh")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => camera.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 whitespace-nowrap"
        >
          <Camera className="h-4 w-4 shrink-0" />{tr("Chụp ảnh")}
        </button>
      </div>

      <input ref={input} type="file" aria-label={tr("Chọn ảnh hóa đơn")} accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={read} disabled={busy} />
      <input ref={camera} type="file" aria-label={tr("Chụp hóa đơn")} accept="image/png,image/jpeg,image/webp" capture="environment" className="sr-only" onChange={read} disabled={busy} />
      {busy && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          {phase === 'ai' ? tr("Đang đọc bằng AI Vision…") : <>{tr("Đang đọc hóa đơn… ")}{progress}%</>}
        </p>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-rose-600">{tr(message)}</p>}
    </ModalDialog>
  );
}
