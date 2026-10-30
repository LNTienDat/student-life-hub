import {useState} from 'react';
import ModalDialog from '../../components/ModalDialog';
import timetableService from '../../services/timetableService';
const style='mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
export default function TimetableAdjustmentModal({item,onClose,onSaved}) {
  const [kind,setKind]=useState('nghi'),[date,setDate]=useState(item.ngayGoc),[start,setStart]=useState(item.gioBatDau),[end,setEnd]=useState(item.gioKetThuc),[room,setRoom]=useState(item.phongHoc||''),[teacher,setTeacher]=useState(item.giangVien||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e){e.preventDefault();if(busy)return;setBusy(true);setError('');try{await timetableService.datDieuChinh(item.id,{ngayGoc:item.ngayGoc,loai:kind,ngayMoi:date,gioBatDau:start,gioKetThuc:end,phongHoc:room,giangVien:teacher});onSaved();onClose();}catch(failure){setError(failure.response?.data?.message||'Chưa điều chỉnh được buổi học.');}finally{setBusy(false);}}
  return <ModalDialog open title="Điều chỉnh một buổi học" busy={busy} onClose={()=>{if(!busy)onClose();}}>
    <p className="mb-4 text-sm text-slate-500">{item.tenMon} · {item.ngayGoc.split('-').reverse().join('/')}<br/>Chỉ áp dụng cho ngày này; lịch hằng tuần được giữ nguyên.</p>
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-3">
      <label className="block text-sm dark:text-white">Thay đổi<select aria-label="Thay đổi" value={kind} onChange={e=>setKind(e.target.value)} className={style}><option value="nghi">Nghỉ buổi này</option><option value="doi">Đổi ngày, giờ hoặc phòng</option></select></label>
      {kind==='doi'&&<><label className="block text-sm dark:text-white">Ngày học mới<input type="date" min="1000-01-01" max="9999-12-31" required value={date} onChange={e=>setDate(e.target.value)} className={style}/></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm dark:text-white">Bắt đầu<input type="time" required value={start} onChange={e=>setStart(e.target.value)} className={style}/></label><label className="text-sm dark:text-white">Kết thúc<input type="time" required value={end} onChange={e=>setEnd(e.target.value)} className={style}/></label></div>
      <label className="block text-sm dark:text-white">Phòng học<input maxLength={50} value={room} onChange={e=>setRoom(e.target.value)} className={style}/></label><label className="block text-sm dark:text-white">Giảng viên<input maxLength={100} value={teacher} onChange={e=>setTeacher(e.target.value)} className={style}/></label></>}
    </fieldset>
    {error&&<p role="alert" className="text-sm text-rose-600">{error}</p>}
    <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 px-3 text-slate-500">Hủy</button><button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-ink-600 px-4 font-semibold text-white">{busy?'Đang lưu…':'Lưu điều chỉnh'}</button></div></form>
  </ModalDialog>;
}
