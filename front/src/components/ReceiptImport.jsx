import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Sparkles } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { recognizeReceipt } from '../services/receiptImage';
import { fetchVisionOcrStatus, scanReceiptWithAI } from '../services/visionOcr';

const AUTO_VISION_KEY = 'slh:receiptAutoVision';

function loadAutoVisionPref() {
  try { return localStorage.getItem(AUTO_VISION_KEY) === 'true'; } catch { return false; }
}

export default function ReceiptImport({ open, onClose, onRecognized }) {
  useLanguage();
  const input = useRef(null), camera = useRef(null), controller = useRef(null), version = useRef(0);
  const modeRef = useRef('local');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  const [phase, setPhase] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);
  const [autoVision, setAutoVision] = useState(loadAutoVisionPref);

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

  function toggleAutoVision(checked) {
    setAutoVision(checked);
    try { localStorage.setItem(AUTO_VISION_KEY, checked ? 'true' : 'false'); } catch { /* Optional preference */ }
  }

  function close() {
    version.current++;
    controller.current?.abort();
    setBusy(false);
    setPhase('');
    setMessage('');
    onClose();
  }

  function triggerPick(pickerRef, mode) {
    modeRef.current = mode;
    pickerRef.current?.click();
  }

  async function read(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const mode = modeRef.current;
    controller.current?.abort();
    const run = ++version.current, abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setProgress(0);
    setPhase(mode === 'vision' ? 'ai' : '');
    setMessage('');
    const timer = setTimeout(() => abort.abort(), 120000);
    try {
      let result;
      if (mode === 'vision') {
        const ai = await scanReceiptWithAI(file, { signal: abort.signal });
        if (run !== version.current) return;
        result = { ...ai, aiUsed: true };
      } else {
        result = await recognizeReceipt(file, {
          signal: abort.signal,
          onProgress: (value) => { if (run === version.current) setProgress(value); },
        });
        if (run !== version.current) return;

        if (aiAvailable && autoVision && (!result.soTien || !result.ngayGiaoDich)) {
          setPhase('ai');
          try {
            const ai = await scanReceiptWithAI(file, { signal: abort.signal, hash: result.anhHoaDonHash });
            if (run !== version.current) return;
            result = {
              ...result,
              loai: ai.loai || result.loai,
              danhMuc: ai.danhMuc && ai.danhMuc !== 'khac' ? ai.danhMuc : result.danhMuc,
              soTien: ai.soTien || result.soTien,
              ngayGiaoDich: ai.ngayGiaoDich || result.ngayGiaoDich,
              moTa: ai.moTa && ai.moTa !== 'Hóa đơn' ? ai.moTa : result.moTa,
              warnings: ai.warnings || result.warnings,
              aiUsed: true,
            };
          } catch (aiErr) {
            if (abort.signal.aborted) throw aiErr;
            const aiMsg = aiErr?.response?.data?.message || aiErr?.message;
            if (aiMsg) {
              result = { ...result, warnings: [...(result.warnings || []), `AI Vision: ${aiMsg}`] };
            }
          }
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
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{tr("Đọc ảnh trên thiết bị. Kiểm tra trước khi lưu.")}</p>

      {aiAvailable && (
        <div className="mt-4 space-y-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-800/70 dark:bg-indigo-950/30">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{tr("Quét nhanh bằng AI Vision ngay từ đầu")}</span>
          </div>
          <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80">
            {tr("Đọc chính xác ngay cả ảnh nghiêng, bị che hoặc thiếu sáng (nén và gửi ảnh đến Google Gemini).")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" disabled={busy} onClick={() => triggerPick(input, 'vision')} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <ImagePlus className="h-4 w-4" />{tr("Chọn ảnh · AI")}
            </button>
            <button type="button" disabled={busy} onClick={() => triggerPick(camera, 'vision')} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-200">
              <Camera className="h-4 w-4" />{tr("Chụp ảnh · AI")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {aiAvailable && <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{tr("Hoặc quét miễn phí trên thiết bị (không gửi ảnh ra ngoài):")}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={busy} onClick={() => triggerPick(input, 'local')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-600 px-4 text-white disabled:opacity-50"><ImagePlus className="h-4 w-4" />{tr("Chọn ảnh")}</button>
          <button type="button" disabled={busy} onClick={() => triggerPick(camera, 'local')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 dark:border-slate-600 dark:text-white disabled:opacity-50"><Camera className="h-4 w-4" />{tr("Chụp ảnh")}</button>
        </div>
      </div>

      {aiAvailable && (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <input
            type="checkbox"
            checked={autoVision}
            disabled={busy}
            onChange={(e) => toggleAutoVision(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600 rounded"
          />
          <span>{tr("Tự động dùng AI Vision nếu quét trên máy chưa đọc đủ (gửi ảnh đã nén đến Google Gemini)")}</span>
        </label>
      )}

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
