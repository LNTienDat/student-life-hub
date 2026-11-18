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

  async function read(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    controller.current?.abort();
    const run = ++version.current, abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setProgress(0);
    setPhase('');
    setMessage('');
    const timer = setTimeout(() => abort.abort(), 120000);
    try {
      let result = await recognizeReceipt(file, {
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

      if (run !== version.current) return;
      onRecognized(result, file);
      onClose();
    } catch (error) {
      if (run === version.current) {
        setMessage(abort.signal.aborted ? 'Đã dừng đọc hóa đơn.' : error.message || 'Chưa đọc được hóa đơn.');
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
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
          <input
            type="checkbox"
            checked={autoVision}
            disabled={busy}
            onChange={(e) => toggleAutoVision(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600 rounded"
          />
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>{tr("Tự động dùng AI Vision nếu quét trên máy chưa đọc đủ (gửi ảnh đã nén đến Google Gemini)")}</span>
          </span>
        </label>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-600 px-4 text-white disabled:opacity-50"><ImagePlus className="h-4 w-4" />{tr("Chọn ảnh")}</button>
        <button type="button" disabled={busy} onClick={() => camera.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 dark:border-slate-600 dark:text-white disabled:opacity-50"><Camera className="h-4 w-4" />{tr("Chụp ảnh")}</button>
      </div>
      <input ref={input} type="file" aria-label={tr("Chọn ảnh hóa đơn")} accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={read} disabled={busy} />
      <input ref={camera} type="file" aria-label={tr("Chụp hóa đơn")} accept="image/png,image/jpeg,image/webp" capture="environment" className="sr-only" onChange={read} disabled={busy} />
      {busy && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          {phase === 'ai' ? tr("Đang nâng cấp kết quả bằng AI Vision…") : <>{tr("Đang đọc hóa đơn… ")}{progress}%</>}
        </p>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-rose-600">{tr(message)}</p>}
    </ModalDialog>
  );
}
