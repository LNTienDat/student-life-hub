import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import CloseButton from '../../components/CloseButton';
import useSessionDraft from '../../hooks/useSessionDraft';
import {validDong,moneyError} from '../../utils/money';
import DeadlineDueInput from '../../components/DeadlineDueInput';
import { deadlineToISO, defaultDeadlineDate } from '../deadline/deadlineDate';
import MoneyInput from '../../components/MoneyInput';
import { useState, useEffect, useRef } from 'react';
import { deadlineService } from '../../services/deadlineService';
import { timetableService } from '../../services/timetableService';
import { financeService } from '../../services/financeService';
import CategorySelect from '../../components/CategorySelect';
import { useToast } from '../../context/ToastContext';
import { useCurrentSemester } from '../../context/SemesterContext';

const inputStyle = 'mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
export default function QuickEntry({ kind, onClose }) {
  useLanguage();
  const formRef = useRef(null);
  const saveLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [due,setDue]=useSessionDraft('quick:'+kind+':due',defaultDeadlineDate);
  const [values,setValues]=useSessionDraft('quick:'+kind+':fields',{});
  const [expenseCategory,setExpenseCategory]=useSessionDraft('quick:'+kind+':category','an_uong');
  useEffect(() => {
    formRef.current?.scrollIntoView({ block: 'nearest' });
    formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  }, []);
  const [error, setError] = useState('');
  const { hienToast } = useToast();
  const { currentSemester: semester } = useCurrentSemester();
  async function submit(event) {
    event.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      if (kind === 'deadline') await deadlineService.themDeadline({ tieuDe: form.title, hanChot: deadlineToISO(form.due), doUuTien: form.priority });
      if (kind === 'class') {
        if (form.end <= form.start) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
        await timetableService.themBuoiHoc({ tenMon: form.title, thu: Number(form.day), gioBatDau: form.start, gioKetThuc: form.end, phongHoc: form.room, hocKy: semester });
      }
      if (kind === 'expense' && !validDong(form.amount)) throw new Error(moneyError);
      if (kind === 'expense') await financeService.themGiaoDich({ loai: 'chi', danhMuc: form.category, soTien: Number(form.amount), moTa: form.title, ngayGiaoDich: new Date().toISOString() });
      hienToast('success', 'Đã lưu. Dữ liệu đang được cập nhật.');
      setValues({});setDue(defaultDeadlineDate());setExpenseCategory('an_uong');
      onClose();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Chưa lưu được, vui lòng thử lại.'); }
    finally { saveLock.current = false; setBusy(false); }
  }
  return <form ref={formRef} onSubmit={submit} onChange={event=>{const field=event.target.name;if(field&&field!=='category'&&field!=='amount')setValues(previous=>({...previous,[field]:event.target.value}));}} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800 sm:p-5" aria-label={tr("Thêm nhanh")}>
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{kind === 'class' ? tr('Thêm lịch học') : kind === 'expense' ? tr('Ghi khoản chi') : tr('Thêm việc cần làm')}</h3><CloseButton onClick={onClose} disabled={busy} label={tr("Đóng biểu mẫu")}/></div>
    <div className={kind==='deadline'?'grid min-w-0 gap-3 sm:grid-cols-3':'grid min-w-0 gap-3 sm:grid-cols-2'}>
      <label className={'min-w-0 text-sm text-slate-600 dark:text-slate-300 '+(kind==='deadline'?'sm:col-span-3':'')}>{kind === 'class' ? tr('Tên môn học') : kind === 'expense' ? tr('Nội dung chi') : tr('Tên công việc')}<input name="title" defaultValue={values.title||''} required maxLength={200} className={inputStyle} autoFocus /></label>
      {kind === 'deadline' && <><div className="min-w-0 sm:col-span-2"><DeadlineDueInput compact id="quick-deadline-due" value={due} onValueChange={setDue} name="due" disabled={busy} /></div><label className="min-w-0 text-sm text-slate-600 dark:text-slate-300"><span className="flex min-h-11 items-center">{tr("Độ ưu tiên")}</span><select name="priority" defaultValue={values.priority||'binh_thuong'} disabled={busy} className={inputStyle}><option value="thap">{tr("Thấp")}</option><option value="binh_thuong">{tr("Bình thường")}</option><option value="cao">{tr("Khẩn cấp")}</option></select></label></>}
      {kind === 'class' && <>
        <label className="text-sm">{tr("Thứ")}<select name="day" defaultValue={values.day||2} className={inputStyle}>{[2,3,4,5,6,7,8].map(day => <option key={day} value={day}>{day === 8 ? tr('Chủ nhật') : tr("Thứ {0}", day)}</option>)}</select></label>
        <label className="text-sm">{tr("Bắt đầu")}<input type="time" name="start" required defaultValue={values.start||'07:00'} className={inputStyle}/></label>
        <label className="text-sm">{tr("Kết thúc")}<input type="time" name="end" required defaultValue={values.end||'09:00'} className={inputStyle}/></label>
        <label className="text-sm">{tr("Phòng học")}<input name="room" defaultValue={values.room||''} maxLength={50} className={inputStyle}/></label>
        <p className="text-xs text-slate-500 self-center">{tr("Học kỳ: ")}{semester || tr('Chưa xếp học kỳ')}</p>
      </>}
      {kind === 'expense' && <>
        <label className="text-sm">{tr("Số tiền (đồng)")}<MoneyInput name="amount" value={values.amount||''} onValueChange={value=>setValues(previous=>({...previous,amount:value}))} required placeholder={tr("Ví dụ: 100 000")} className={inputStyle}/></label>
        <div className="text-sm"><span>{tr("Danh mục")}</span><CategorySelect name="category" value={expenseCategory} onChange={setExpenseCategory} className={inputStyle}/></div>
      </>}
    </div>
    {error && <p role="alert" className="text-sm text-rose-600">{tr(error)}</p>}
    <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700"><button disabled={busy} className="min-h-11 rounded-xl bg-ink-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? tr('Đang lưu…') : tr('Lưu')}</button></div>
  </form>;
}
