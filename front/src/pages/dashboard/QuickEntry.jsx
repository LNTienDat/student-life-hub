import { useState, useEffect, useRef } from 'react';
import { deadlineService } from '../../services/deadlineService';
import { timetableService } from '../../services/timetableService';
import { financeService } from '../../services/financeService';
import { DANH_MUC_CHI, TEN_DANH_MUC } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useSemester } from '../../hooks/useSemester';

const inputStyle = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm';
export default function QuickEntry({ kind, onClose }) {
  const formRef = useRef(null);
  const saveLock = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    formRef.current?.scrollIntoView({ block: 'nearest' });
    formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  }, []);
  const [error, setError] = useState('');
  const { hienToast } = useToast();
  const [semester] = useSemester();
  async function submit(event) {
    event.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      if (kind === 'deadline') await deadlineService.themDeadline({ tieuDe: form.title, hanChot: new Date(form.due).toISOString() });
      if (kind === 'class') {
        if (form.end <= form.start) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
        await timetableService.themBuoiHoc({ tenMon: form.title, thu: Number(form.day), gioBatDau: form.start, gioKetThuc: form.end, phongHoc: form.room, hocKy: semester });
      }
      if (kind === 'expense') await financeService.themGiaoDich({ loai: 'chi', danhMuc: form.category, soTien: Number(form.amount), moTa: form.title, ngayGiaoDich: new Date().toISOString() });
      hienToast('success', 'Đã lưu. Dữ liệu đang được cập nhật.');
      onClose();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Chưa lưu được, vui lòng thử lại.'); }
    finally { saveLock.current = false; setBusy(false); }
  }
  return <form ref={formRef} onSubmit={submit} className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3" aria-label="Thêm nhanh">
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{kind === 'class' ? 'Thêm lịch học' : kind === 'expense' ? 'Ghi khoản chi' : 'Thêm việc cần làm'}</h3><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-lg px-3 text-sm text-slate-500">Đóng</button></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{kind === 'class' ? 'Tên môn học' : kind === 'expense' ? 'Nội dung chi' : 'Tên công việc'}<input name="title" required maxLength={200} className={inputStyle} autoFocus /></label>
      {kind === 'deadline' && <label className="text-sm">Hạn chót<input type="datetime-local" name="due" required className={inputStyle}/></label>}
      {kind === 'class' && <>
        <label className="text-sm">Thứ<select name="day" className={inputStyle}>{[2,3,4,5,6,7,8].map(day => <option key={day} value={day}>{day === 8 ? 'Chủ nhật' : `Thứ ${day}`}</option>)}</select></label>
        <label className="text-sm">Bắt đầu<input type="time" name="start" required defaultValue="07:00" className={inputStyle}/></label>
        <label className="text-sm">Kết thúc<input type="time" name="end" required defaultValue="09:00" className={inputStyle}/></label>
        <label className="text-sm">Phòng học<input name="room" maxLength={50} className={inputStyle}/></label>
        <p className="text-xs text-slate-500 self-center">Học kỳ: {semester || 'Chưa xếp học kỳ'}</p>
      </>}
      {kind === 'expense' && <>
        <label className="text-sm">Số tiền (đồng)<input name="amount" type="number" min="1" step="1" required className={inputStyle}/></label>
        <label className="text-sm">Danh mục<select name="category" className={inputStyle}>{DANH_MUC_CHI.map(category => <option key={category} value={category}>{TEN_DANH_MUC[category]}</option>)}</select></label>
      </>}
    </div>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    <button disabled={busy} className="min-h-11 rounded-xl bg-ink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu'}</button>
  </form>;
}
