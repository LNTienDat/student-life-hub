import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import timetableService from '../services/timetableService';
import { recognizeTimetable } from '../services/timetableImage';
import { imageRowsUpload, validateImageRows } from '../pages/thoikhoabieu/imageImportUtils';

const inputStyle='mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
export default function TimetableImageImport({ semester: initialSemester = '', onImported }) {
  const [open,setOpen]=useState(false);
  const [semester,setSemester]=useState(initialSemester);
  const [rows,setRows]=useState([]);
  const [text,setText]=useState('');
  const [image,setImage]=useState('');
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [progress,setProgress]=useState(0);
  const [message,setMessage]=useState('');
  const [existing,setExisting]=useState([]);
  const [existingReady,setExistingReady]=useState(false);
  const [retry,setRetry]=useState(0);
  const fileRef=useRef(null);
  const cameraRef=useRef(null);
  const run=useRef(0);
  const controller=useRef(null);
  const imageUrl=useRef('');
  const lock=useRef(false);
  useEffect(()=>()=>{run.current++;controller.current?.abort();if(imageUrl.current)URL.revokeObjectURL(imageUrl.current);},[]);
  useEffect(()=>{
    if(!open)return;
    let active=true;
    timetableService.layThoiKhoaBieu().then(({data})=>{if(active){setExisting(data.thoiKhoaBieu || []);setExistingReady(true);}}).catch(()=>{if(active)setMessage('Chưa tải được lịch hiện có. Bấm kiểm tra lại để tiếp tục.');});
    return ()=>{active=false;};
  },[open,retry]);
  function cancel(){run.current++;controller.current?.abort();setBusy(false);}
  function toggle(){if(open)cancel();else{setExistingReady(false);}setOpen(!open);}
  async function read(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    cancel();const version=++run.current;const abort=new AbortController();controller.current=abort;
    setMessage('');setRows([]);setText('');setProgress(0);setBusy(true);
    if(imageUrl.current)URL.revokeObjectURL(imageUrl.current);
    imageUrl.current=URL.createObjectURL(file);setImage(imageUrl.current);
    const timer=setTimeout(()=>abort.abort('timeout'),120000);
    try{
      const result=await recognizeTimetable(file,{signal:abort.signal,onProgress:value=>{if(version===run.current)setProgress(value);}});
      if(version!==run.current)return;
      setRows(result.rows);setText(result.text);
      setMessage(result.rows.length?'Đã đọc ảnh. Kiểm tra từng buổi trước khi lưu.':'Chưa nhận ra buổi học. Thử ảnh rõ hơn hoặc thêm dòng để nhập lại.');
    }catch(error){if(version===run.current)setMessage(abort.signal.aborted?'Đã dừng đọc ảnh. Bạn có thể chọn ảnh khác.':error.message || 'Không đọc được ảnh. Thử chụp rõ và thẳng hơn.');}
    finally{clearTimeout(timer);if(version===run.current)setBusy(false);}
  }
  function update(id,key,value){setRows(previous=>previous.map(row=>row.id===id?{...row,[key]:value}:row));setMessage('');}
  function add(){setRows(previous=>[...previous,{id:crypto.randomUUID(),selected:true,tenMon:'',thu:'',gioBatDau:'',gioKetThuc:'',phongHoc:'',giangVien:'',warning:''}]);}
  const checks=validateImageRows(rows,semester,existing);
  const selected=rows.filter(row=>row.selected).length;
  const count=rows.filter((row,index)=>row.selected&&!checks[index].duplicate).length;
  const invalid=checks.some(check=>check.errors.length);
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
      <p className="text-slate-500 dark:text-slate-300">Chọn ảnh → kiểm tra, chỉnh sửa → lưu lịch. Ảnh được đọc trên thiết bị của bạn.</p>
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
        <fieldset disabled={saving} className="space-y-3" aria-label="Chỉnh sửa lịch nhận diện">
          {rows.map((row,index)=><article key={row.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-600">
            <div className="mb-3 flex items-center justify-between gap-3"><label className="inline-flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" checked={row.selected} onChange={event=>update(row.id,'selected',event.target.checked)}/>Buổi {index+1}</label><button type="button" onClick={()=>setRows(previous=>previous.filter(item=>item.id!==row.id))} aria-label={`Bỏ buổi ${index+1}`} className="inline-flex min-h-11 min-w-11 items-center justify-center text-rose-600"><Trash2 aria-hidden="true" className="h-4 w-4"/></button></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label>Tên môn<input value={row.tenMon} maxLength={100} onChange={e=>update(row.id,'tenMon',e.target.value)} className={inputStyle}/></label>
              <label>Thứ<select value={row.thu} onChange={e=>update(row.id,'thu',e.target.value)} className={inputStyle}><option value="">Chọn thứ</option>{[2,3,4,5,6,7,8].map(day=><option key={day} value={day}>{day===8?'Chủ nhật':`Thứ ${day}`}</option>)}</select></label>
              <label>Bắt đầu<input type="time" value={row.gioBatDau} onChange={e=>update(row.id,'gioBatDau',e.target.value)} className={inputStyle}/></label>
              <label>Kết thúc<input type="time" value={row.gioKetThuc} onChange={e=>update(row.id,'gioKetThuc',e.target.value)} className={inputStyle}/></label>
              <label>Phòng<input value={row.phongHoc} maxLength={50} onChange={e=>update(row.id,'phongHoc',e.target.value)} className={inputStyle}/></label>
              <label>Giảng viên<input value={row.giangVien} maxLength={100} onChange={e=>update(row.id,'giangVien',e.target.value)} className={inputStyle}/></label>
            </div>
            {row.warning&&<p className="mt-2 text-amber-700 dark:text-amber-300">{row.warning}</p>}
            {checks[index].duplicate&&row.selected&&<p className="mt-2 text-slate-500">Buổi này đã có, sẽ bỏ qua.</p>}
            {checks[index].errors.length>0&&<p role="alert" className="mt-2 text-rose-600 dark:text-rose-300">{checks[index].errors.join(' ')}</p>}
          </article>)}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving||rows.length>=100} onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3"><Plus className="h-4 w-4"/>Thêm dòng</button><span className="text-slate-500">Đã chọn {selected} buổi · {count} buổi mới</span><button type="button" disabled={busy||saving||invalid||!count||!existingReady} onClick={save} className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">{saving?'Đang lưu…':`Lưu ${count} buổi học`}</button></div>
      </>}
      {text&&<details><summary className="cursor-pointer py-2 text-ink-600">Xem chữ nhận diện</summary><pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">{text}</pre></details>}
    </div>}
  </section>;
}
