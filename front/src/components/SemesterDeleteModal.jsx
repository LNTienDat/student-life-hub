import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import {useEffect,useRef,useState} from 'react';
import api from '../services/api';
import ModalDialog from './ModalDialog';
import {normalizeSemester} from '../utils/semester';
import {useCurrentSemester} from '../context/SemesterContext';
export default function SemesterDeleteModal({semester,onClose,onDeleted}){
  useLanguage();
 const {applyDeletedSemester}=useCurrentSemester();
 const [preview,setPreview]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[name,setName]=useState(''),[attempt,setAttempt]=useState(0);
 const lock=useRef(false);
 useEffect(()=>{let active=true;api.get('/hoc-ky/kiem-tra-xoa',{params:{ten:semester}}).then(({data})=>{if(active){setPreview(data);}}).catch(e=>{if(active)setError(e.response?.data?.message||'Chưa kiểm tra được học kỳ.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[semester,attempt]);
 async function submit(e){e.preventDefault();if(lock.current||!preview||normalizeSemester(name)!==semester)return;lock.current=true;setBusy(true);setError('');try{
   const {data}=await api.delete('/hoc-ky',{data:{ten:semester,snapshot:preview.snapshot,xacNhan:name}});
   applyDeletedSemester(semester,data.hocKyHienTai,data.hocKyDaLuu);
   onDeleted(semester);onClose();
 }catch(failure){setError(failure.response?.data?.message||'Chưa xóa được học kỳ.');if(failure.response?.status===409){setPreview(null);setName('');setLoading(true);setAttempt(n=>n+1);}}finally{lock.current=false;setBusy(false);}}
 return <ModalDialog open title={tr("Xóa học kỳ?")} busy={busy} onClose={()=>{if(!busy)onClose();}}>
  <p className="mb-3 break-words font-semibold dark:text-white">{semester}</p>
  {loading?<p role="status" className="text-sm text-slate-500">{tr("Đang kiểm tra dữ liệu…")}</p>:preview&&<form onSubmit={submit} className="space-y-4">
   <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{tr("Xóa ")}{preview.soMon}{tr(" môn học, ")}{preview.soDiem}{tr(" điểm, ")}{preview.soBuoi}{tr(" lịch lặp và ")}{preview.soDieuChinh}{tr(" điều chỉnh riêng thuộc học kỳ này. Không thể hoàn tác.")}</p>
   <p className="text-sm text-slate-500 dark:text-slate-400">{tr("Giữ giao dịch tài chính và deadline. Deadline gắn với môn sẽ được bỏ liên kết môn.")}{preview.dangHoc?tr(' Học kỳ đang học sẽ được bỏ chọn.'):''}</p>
   <label className="block text-sm dark:text-white">{tr("Nhập tên học kỳ để xác nhận")}<input aria-label={tr("Tên học kỳ xác nhận xóa")} autoComplete="off" required disabled={busy} value={name} onChange={e=>setName(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"/></label>
   <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 px-4 text-slate-500">{tr("Hủy")}</button><button type="submit" disabled={busy||normalizeSemester(name)!==semester} className="min-h-11 rounded-xl bg-rose-600 px-4 font-semibold text-white disabled:opacity-40">{busy?tr('Đang xóa…'):tr('Xóa học kỳ')}</button></div>
  </form>}
  {error&&<p role="alert" className="mt-3 text-sm text-rose-600">{tr(error)}</p>}
  {!loading&&!preview&&<button type="button" onClick={()=>{setError('');setLoading(true);setAttempt(n=>n+1);}} className="mt-3 min-h-11 px-3 text-ink-600">{tr("Thử lại")}</button>}
 </ModalDialog>;
}
