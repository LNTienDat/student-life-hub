import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Plus, X } from 'lucide-react';
import api from '../services/api';
import timetableService from '../services/timetableService';
import TimetableImagePreview from './TimetableImagePreview';
import { useTimetableImport } from '../context/TimetableImportContext';
import { imageRowsUpload, validateImageRows } from '../pages/thoikhoabieu/imageImportUtils';

const inputStyle='mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
export default function TimetableImageImport({ semester: initialSemester = '', onImported }) {
  const draft=useTimetableImport();
  const { job, open, rows, text, image, busy, progress, message }=draft;
  const semester=draft.semester ?? initialSemester;
  const setOpen=value=>job.set('open',value);
  const setSemester=value=>job.set('semester',value);
  const setRows=value=>job.set('rows',value);
  const setText=value=>job.set('text',value);
  const setMessage=value=>job.set('message',value);
  const [saving,setSaving]=useState(false);
  const [existing,setExisting]=useState([]);
  const [existingReady,setExistingReady]=useState(false);
  const [retry,setRetry]=useState(0);
  const fileRef=useRef(null);
  const cameraRef=useRef(null);
  const lock=useRef(false);
  useEffect(()=>{
    if(!open)return;
    let active=true;
    timetableService.layThoiKhoaBieu().then(({data})=>{if(active){setExisting(data.thoiKhoaBieu || []);setExistingReady(true);}}).catch(()=>{if(active)job.set('message','Chưa tải được lịch hiện có. Bấm kiểm tra lại để tiếp tục.');});
    return ()=>{active=false;};
  },[open,retry,job]);
  function cancel(){job.cancel();}
  function toggle(){if(!open)setExistingReady(false);setOpen(!open);}
  function read(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    job.read(file,semester,existing.map(item=>item.tenMon));
  }
  function update(id,key,value){setRows(previous=>previous.map(row=>row.id===id?{...row,[key]:value}:row));setMessage('');}
  function add(){setRows(previous=>[...previous,{id:crypto.randomUUID(),selected:true,tenMon:'',thu:'',gioBatDau:'',gioKetThuc:'',phongHoc:'',giangVien:'',warning:''}]);}
  const checks=validateImageRows(rows,semester,existing);
  const selected=rows.filter(row=>row.selected).length;
  const count=rows.filter((row,index)=>row.selected&&!checks[index].duplicate).length;
  const semesterError=!semester.trim()?'Nhập học kỳ trước khi lưu lịch.':semester.trim().length>100?'Học kỳ tối đa 100 ký tự.':'';
  const invalid=!!semesterError||checks.some(check=>check.errors.length);
  async function save(){
    if(lock.current||busy||invalid||!count||!existingReady)return;
    lock.current=true;setSaving(true);setMessage('');
    try{
      const {data}=await api.post('/imports/commit',imageRowsUpload(rows,semester));
      setRows([]);setText('');setMessage(`Đã lưu ${data.count} buổi; bỏ qua ${data.skipped} buổi đã có.`);
      onImported?.();
      try { const current=await timetableService.layThoiKhoaBieu();setExisting(current.data.thoiKhoaBieu || []); } catch { setExistingReady(false); }
    }catch(error){setMessage(error.response?.data?.message || 'Chưa xác nhận được kết quả lưu. Kiểm tra lịch trước khi thử lại.');}
    finally{lock.current=false;setSaving(false);}
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
    <button type="button" onClick={toggle} disabled={saving} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink-600 dark:text-ink-300"><ImagePlus aria-hidden="true" className="h-5 w-5" />{open?'Ẩn nhập lịch từ ảnh':'Nhập lịch từ ảnh'}</button>
    {open&&<div className="mt-3 space-y-4">
      <p className="text-slate-500 dark:text-slate-300">Chọn ảnh → kiểm tra, chỉnh sửa → lưu lịch. Ảnh chỉ được xử lý trong trình duyệt, không tải lên máy chủ.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy||saving} onClick={()=>fileRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-600 px-4 text-white disabled:opacity-50"><ImagePlus aria-hidden="true" className="h-4 w-4"/>Chọn ảnh</button>
        <button type="button" disabled={busy||saving} onClick={()=>cameraRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 disabled:opacity-50"><Camera aria-hidden="true" className="h-4 w-4"/>Chụp ảnh</button>
        {busy&&<button type="button" onClick={cancel} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3"><X className="h-4 w-4"/>Dừng đọc</button>}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={read} aria-label="Chọn ảnh thời khóa biểu" className="sr-only" disabled={busy||saving}/>
      <input ref={cameraRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={read} aria-label="Chụp ảnh thời khóa biểu" className="sr-only" disabled={busy||saving}/>
      {busy&&<div role="status" className="space-y-2"><p>{progress?`Đang đọc ảnh · ${progress}%`:'Đang chuẩn bị nhận diện… Lần đầu có thể mất một lúc.'}</p><progress max="100" value={progress||undefined} className="w-full"/></div>}
      {message&&<p role="status" className="rounded-xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{message}</p>}
      {!existingReady&&<button type="button" disabled={saving} onClick={()=>setRetry(value=>value+1)} className="min-h-11 text-ink-600 underline">Kiểm tra lại lịch hiện có</button>}
      {image&&<details><summary className="cursor-pointer py-2 text-ink-600">Xem ảnh gốc</summary><img src={image} alt="Ảnh thời khóa biểu đã chọn" className="mt-2 max-h-96 max-w-full rounded-xl object-contain"/></details>}
      {!busy&&(image||rows.length>0)&&<>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Lịch sẽ lặp hằng tuần theo học kỳ. Nếu ảnh chỉ là một tuần mẫu, hãy bỏ chọn buổi nghỉ hoặc thay đổi trước khi lưu.</div>
        <label className="block max-w-md font-medium">Học kỳ<input value={semester} onChange={event=>{setSemester(event.target.value);setMessage('');}} disabled={saving} placeholder="Ví dụ: HK1 2026–2027" maxLength={100} className={inputStyle}/></label>
        <TimetableImagePreview rows={rows} checks={checks} saving={saving} onUpdate={update} onRemove={id=>setRows(previous=>previous.filter(item=>item.id!==id))}/>

        {semesterError&&selected>0&&<p role="alert" className="text-rose-600 dark:text-rose-300">{semesterError}</p>}
        <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving||rows.length>=100} onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3"><Plus className="h-4 w-4"/>Thêm dòng</button><span className="text-slate-500">Đã chọn {selected} buổi · {count} buổi mới</span><button type="button" disabled={busy||saving||invalid||!count||!existingReady} onClick={save} className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">{saving?'Đang lưu…':`Lưu ${count} buổi học`}</button></div>
      </>}
      {text&&<details><summary className="cursor-pointer py-2 text-ink-600">Xem chữ nhận diện</summary><pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">{text}</pre></details>}
    </div>}
  </section>;
}
