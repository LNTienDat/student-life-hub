import ModalDialog from '../../components/ModalDialog';
import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useToast } from '../../context/ToastContext';

export default function TimetableShareModal({ isOpen, onClose, semester = '' }) {
  const [status, setStatus] = useState(null);
  const [scope, setScope] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { hienToast } = useToast();
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    timetableService.layTrangThaiChiaSe().then(({ data }) => {
      if (!active) return;
      if (!Array.isArray(data.hocKys) || !Object.hasOwn(data, 'hocKyChiaSe')) throw new Error('Cần cập nhật máy chủ trước khi chia sẻ theo học kỳ.');
      setStatus(data);
      setScope(data.shareEnabled ? data.hocKyChiaSe : semester && data.hocKys.includes(semester) ? semester : data.hocKyDeXuat);
    }).catch(failure => { if (active) setError(failure.response?.data?.message || failure.message || 'Chưa tải được trạng thái chia sẻ. Vui lòng đóng và mở lại.'); });
    return () => { active = false; };
  }, [isOpen, semester]);
  const scopeLabel = value => value || 'Lịch dùng chung (chưa gắn học kỳ)';
  const options = [...new Set([...(status?.hocKys || []), ...(status?.hocKyChiaSe ? [status.hocKyChiaSe] : [])])];
  const publicUrl = status?.shareEnabled && status.shareToken ? window.location.origin + '/chia-se-tkb/' + status.shareToken : '';
  async function enable() {
    if (busy || !status || scope === null) return;
    setBusy(true); setError('');
    try {
      const { data } = await timetableService.batChiaSe(scope);
      setStatus(previous => ({ ...previous, ...data, canTaoLaiLienKet: false }));
      hienToast('success', 'Đã chia sẻ ' + scopeLabel(data.hocKyChiaSe) + '.');
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Chưa bật được chia sẻ.'); }
    finally { setBusy(false); }
  }
  async function disable() {
    if (busy) return;
    setBusy(true); setError('');
    try { await timetableService.tatChiaSe(); setStatus(previous => ({ ...previous, shareEnabled: false, shareToken: null })); hienToast('info', 'Đã tắt chia sẻ thời khóa biểu.'); }
    catch (failure) { setError(failure.response?.data?.message || failure.message || 'Chưa tắt được chia sẻ.'); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(publicUrl); hienToast('success', 'Đã sao chép liên kết.'); }
    catch { hienToast('error', 'Bạn có thể chọn liên kết để sao chép thủ công.'); }
  }
  return <ModalDialog open={isOpen} onClose={onClose} title="Chia sẻ thời khóa biểu" busy={busy}>
    {!status && !error && <p role="status" className="text-sm text-slate-500">Đang tải trạng thái chia sẻ…</p>}
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    {status && <div className="space-y-4 text-sm">
      <p className="text-slate-500 dark:text-slate-300">Chọn phạm vi trước khi bật. Người có liên kết chỉ xem được lịch của phạm vi này.</p>
      {status.canTaoLaiLienKet && <p className="text-amber-700 dark:text-amber-300">Liên kết cũ chưa có phạm vi học kỳ. Chọn học kỳ và bật lại để tạo liên kết mới.</p>}
      <label className="block font-medium">Học kỳ chia sẻ
        <select aria-label="Học kỳ chia sẻ" value={scope ?? '__choose__'} disabled={busy} onChange={event => setScope(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
          {scope === null && <option value="__choose__" disabled>Chọn học kỳ</option>}
          {options.map(value => <option key={value} value={value}>{value}</option>)}
          <option value="">Lịch dùng chung (chưa gắn học kỳ)</option>
        </select>
      </label>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Khi chọn học kỳ, lịch dùng chung cũng được hiển thị. Nghỉ/đổi riêng từng ngày vẫn được áp dụng. Đổi phạm vi tạo liên kết mới và vô hiệu hóa liên kết trước.</p>
      <div className="flex flex-wrap gap-2">
        {(!status.shareEnabled || scope !== status.hocKyChiaSe) && <button type="button" onClick={enable} disabled={busy || scope === null} className="min-h-11 rounded-xl bg-ink-600 px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : status.shareEnabled ? 'Đổi phạm vi chia sẻ' : 'Bật chia sẻ'}</button>}
        {status.shareEnabled && <button type="button" onClick={disable} disabled={busy} className="min-h-11 rounded-xl border border-rose-200 px-4 font-semibold text-rose-600 disabled:opacity-50">Tắt chia sẻ</button>}
      </div>
      {publicUrl && <section aria-label="Liên kết đang chia sẻ" className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
        <p className="break-words font-medium">Đang chia sẻ: {scopeLabel(status.hocKyChiaSe)}</p>
        <div className="flex min-w-0 gap-2"><input aria-label="Liên kết chia sẻ" readOnly value={publicUrl} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-600 dark:bg-slate-800" /><button type="button" onClick={copy} aria-label="Sao chép liên kết" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-600 text-white"><Copy className="h-4 w-4"/></button></div>
        <p className="text-xs text-slate-500">Đổi học kỳ đang học sau này không làm thay đổi phạm vi của liên kết đã tạo.</p>
      </section>}
    </div>}

  </ModalDialog>;
}
