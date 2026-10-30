import SemesterDeleteModal from './SemesterDeleteModal';
import ModalDialog from './ModalDialog';
import { GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { normalizeSemester } from '../utils/semester';
import { useEffect, useState } from 'react';
import { useSemester } from '../hooks/useSemester';
import { useCurrentSemester } from '../context/SemesterContext';
import useDataRevision from '../hooks/useDataRevision';
import { academicService } from '../services/academicService';
import { timetableService } from '../services/timetableService';
import { useAuth } from '../context/AuthContext';

export default function SemesterPicker() {
  const [semester,setSemester]=useSemester();
  const {currentSemester,loading,saving,error,retry,saveCurrentSemester}=useCurrentSemester();
  const [semesters,setSemesters]=useState([]),[changing,setChanging]=useState(false),[savedDraft,setSavedDraft]=useState(''),[newDraft,setNewDraft]=useState(''),[message,setMessage]=useState(''),[deleting,setDeleting]=useState('');
  const {hienToast}=useToast(),{user}=useAuth();
  const revision=useDataRevision();
  useEffect(()=>{
    let active=true;
    Promise.allSettled([academicService.layDanhSachMonHoc(),timetableService.layThoiKhoaBieu()]).then(([subjects,classes])=>{
      const values=[...(subjects.value?.data?.monHocs||[]),...(classes.value?.data?.thoiKhoaBieu||[])].map(item=>normalizeSemester(item.hocKy)).filter(Boolean);
      if(active)setSemesters([...new Set(values)].sort((a,b)=>b.localeCompare(a,'vi',{numeric:true})));
    });
    return()=>{active=false;};
  },[revision,user.id]);
  const options=[...new Set([currentSemester,...(user.hocKyDaLuu||[]).map(normalizeSemester),...semesters].filter(Boolean))];
  useEffect(()=>{
    if(!loading&&!error&&semester!==currentSemester)setSemester(currentSemester);
  },[currentSemester,semester,setSemester,loading,error]);
  const draft=normalizeSemester(newDraft)||savedDraft;
  function openChange(){setSavedDraft(currentSemester);setNewDraft('');setMessage('');setChanging(true);}
  async function submit(event){
    event.preventDefault();setMessage('');
    try{if(await saveCurrentSemester(draft)){setChanging(false);hienToast('success','Đã áp dụng học kỳ '+normalizeSemester(draft)+'.');}}
    catch(failure){setMessage(failure.response?.data?.message||failure.message||'Chưa lưu được học kỳ.');}
  }
  return <section aria-label="Thiết lập học kỳ" className="mb-6 w-full min-w-0 text-sm">
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800 ">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-600 dark:bg-ink-500/10 dark:text-ink-300"><GraduationCap className="h-5 w-5" aria-hidden="true"/></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Học kỳ đang học</p>
          <p className="mt-1 break-words font-semibold text-slate-900 dark:text-white">{currentSemester||'Chưa chọn học kỳ'}</p>
        </div>

      </div>
        <button type="button" disabled={loading||saving} onClick={openChange} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:text-ink-300 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" aria-hidden="true"/>{currentSemester?'Đổi học kỳ':'Chọn học kỳ'}</button>
    </div>
    {error&&<p role="alert" className="mt-2 text-rose-600">{error} <button type="button" onClick={retry} className="min-h-11 underline">Thử lại</button></p>}
    <ModalDialog wide open={changing} title={currentSemester?'Đổi học kỳ':'Chọn học kỳ đang học'} busy={saving} onClose={()=>{if(!saving)setChanging(false);}}>
      <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Chọn học kỳ đã lưu hoặc nhập học kỳ mới. Áp dụng cho Học tập và Thời khóa biểu.</p>
      <form aria-label="Chọn học kỳ đang học" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <label htmlFor="saved-semester" className="mb-3 flex h-8 items-center text-sm font-semibold text-slate-700 dark:text-slate-200">Học kỳ đã lưu</label>
            <div className="flex items-center gap-2">
              <select id="saved-semester" aria-label="Chọn học kỳ đã lưu" value={savedDraft} onChange={event=>{setSavedDraft(event.target.value);setNewDraft('');setMessage('');}} disabled={saving||!options.length} className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                <option value="">{options.length?'Chọn học kỳ':'Chưa có học kỳ đã lưu'}</option>{options.map(value=><option key={value} value={value}>{value}</option>)}
              </select>
              {savedDraft&&<button type="button" aria-label="Xóa học kỳ đã chọn" title={'Xóa '+savedDraft} disabled={loading||saving} onClick={()=>{setChanging(false);setDeleting(savedDraft);}} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" aria-hidden="true"/></button>}
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <label htmlFor="new-semester" className="mb-3 flex h-8 items-center text-sm font-semibold text-slate-700 dark:text-slate-200">Nhập học kỳ mới</label>
            <input id="new-semester" aria-label="Nhập học kỳ mới" value={newDraft} onChange={event=>{setNewDraft(event.target.value);setSavedDraft('');setMessage('');}} maxLength={100} placeholder="Ví dụ: HK1 2026–2027" disabled={saving} className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"/>
          </div>
        </div>
        {message&&<p role="alert" className="text-sm text-rose-600">{message}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" disabled={saving} onClick={()=>setChanging(false)} className="min-h-11 rounded-xl px-4 text-sm text-slate-500">Hủy</button>
          <button type="submit" disabled={loading||saving||!draft} className="min-h-11 rounded-xl bg-ink-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving?'Đang lưu…':'Áp dụng học kỳ'}</button>
        </div>
      </form>
    </ModalDialog>
    {deleting&&<SemesterDeleteModal key={deleting} semester={deleting} onClose={()=>setDeleting('')} onDeleted={name=>{setSemesters(items=>items.filter(item=>item!==name));hienToast('success','Đã xóa học kỳ '+name+'.');}}/>}
  </section>;
}
