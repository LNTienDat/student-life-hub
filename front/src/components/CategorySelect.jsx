import { useEffect, useRef, useState } from 'react';
import { Settings2, Trash2, Pencil, RotateCcw } from 'lucide-react';
import { useFinanceCategories } from '../context/FinanceCategoryContext';
import ModalDialog from './ModalDialog';
const inputStyle='mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
export default function CategorySelect({loai='chi',value,onChange,id,name,className='',label='Danh mục',disabled=false,allowArchived=false}) {
  const {categories,loaded,addCategory,removeCategory,renameCategory,error,retry}=useFinanceCategories();
  const [mode,setMode]=useState(null),[target,setTarget]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const lock=useRef(false),back=useRef(false);
  const all=categories.filter(item=>item.loai===loai);
  const options=all.filter(item=>!item.daAn);
  const selected=all.find(item=>item.ma===value);
  const choices=allowArchived&&selected?.daAn?[...options,selected]:options;
  useEffect(()=>{if(!loaded||busy||allowArchived)return;const visible=categories.filter(item=>item.loai===loai&&!item.daAn);if(!visible.some(item=>item.ma===value)){const next='';if(next!==value)onChange(next);}},[loaded,busy,allowArchived,categories,loai,value,onChange]);
  function open(next,item=null,fromManager=false){setMessage('');setTarget(item);back.current=fromManager;setMode(next);}
  function cancel(){setMessage('');setMode(back.current?'manage':null);}
  async function action(request,done) {
    if(lock.current)return;lock.current=true;setBusy(true);setMessage('');
    try{const result=await request();done?.(result);}
    catch(e){setMessage(e.response?.data?.message||'Chưa cập nhật được danh mục.');}
    finally{lock.current=false;setBusy(false);}
  }
  function submit(event){
    event.preventDefault();event.stopPropagation();
    const ten=new FormData(event.currentTarget).get('ten');
    action(()=>mode==='rename'?renameCategory(target.ma,ten,target.loai):addCategory(loai,ten),result=>{if(mode==='add')onChange(result.ma);setMode(back.current?'manage':null);});
  }
  const title=mode==='manage'?'Quản lý danh mục':mode==='rename'?'Đổi tên danh mục':mode==='delete'?'Xóa danh mục?':loai==='chi'?'Thêm danh mục chi tiêu':'Thêm danh mục thu nhập';
  return <>
    <div className="flex min-w-0 items-center gap-1">
      <select required id={id} name={name} value={value} aria-label={label} disabled={disabled||busy} onChange={e=>onChange(e.target.value)} className={className+' min-w-0 w-full flex-1'}>
        {(!choices.length||!choices.some(item=>item.ma===value))&&<option value="" disabled>{loaded?'Chọn hoặc thêm danh mục':'Đang tải danh mục…'}</option>}
        {choices.map(item=><option key={item.ma} value={item.ma}>{item.ten}{item.daAn?' (đã xóa khỏi danh sách)':''}</option>)}
      </select>
      <button type="button" title="Quản lý danh mục" aria-label={'Quản lý danh mục '+(loai==='chi'?'chi tiêu':'thu nhập')} disabled={disabled||busy} onClick={e=>{e.preventDefault();open('manage');}} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:text-ink-300 dark:hover:bg-slate-700"><Settings2 className="h-4 w-4" aria-hidden="true"/><span>Quản lý</span></button>
    </div>
    {error&&<p className="mt-1 text-xs text-rose-600">{error} <button type="button" onClick={retry} className="underline">Thử lại</button></p>}
    <ModalDialog open={!!mode} title={title} busy={busy} onClose={()=>{if(!busy)setMode(null);}}>
      {mode==='manage'?<>
        <p className="mb-3 text-sm text-slate-500">Sửa tên, xóa hoặc khôi phục danh mục. Danh mục điền sẵn cũng có thể thay đổi.</p>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">{options.map(item=><li key={item.ma} className="flex min-w-0 items-center justify-between gap-2 py-2">
          <span className="min-w-0 break-words text-sm dark:text-white">{item.ten}</span>
          {item.coTheXoa?<div className="flex shrink-0"><button type="button" disabled={busy} aria-label={'Đổi tên danh mục '+item.ten} onClick={()=>open('rename',item,true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50"><Pencil className="h-4 w-4"/></button><button type="button" disabled={busy} aria-label={'Xóa danh mục '+item.ten} onClick={()=>open('delete',item,true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div>:<span className="shrink-0 text-xs text-slate-400">{item.macDinh?'Cơ bản':'Dữ liệu cũ'}</span>}
        </li>)}</ul>
        <section aria-label="Danh mục đã xóa" className="mt-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-700"><h3 className="mb-2 font-semibold">Đã bỏ khỏi danh sách</h3>{!all.some(item=>item.daAn)&&<p className="text-xs text-slate-500">Chưa có danh mục đã xóa. Các mục bạn xóa sẽ hiện ở đây để khôi phục.</p>}{all.filter(item=>item.daAn).map(item=><div key={item.ma} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0 break-words">{item.ten}</span><button type="button" disabled={busy} onClick={()=>action(()=>addCategory(loai,item.ten))} aria-label={'Khôi phục '+item.ten} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-ink-600"><RotateCcw className="h-4 w-4"/>Khôi phục</button></div>)}</section>
        <div className="mt-4 flex justify-between gap-2"><button type="button" disabled={busy} onClick={()=>open('add',null,true)} className="min-h-11 text-sm font-semibold text-ink-600">+ Thêm danh mục</button></div>
      </>:mode==='delete'?<>
        <p className="break-words font-semibold dark:text-white">{target?.ten}</p><p className="mt-3 text-sm leading-relaxed text-slate-500">Bỏ khỏi lựa chọn mới; giao dịch, ngân sách và báo cáo cũ giữ nguyên. Có thể khôi phục trong Quản lý danh mục.</p>
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={cancel} className="min-h-11 px-4 text-slate-500">Hủy</button><button type="button" disabled={busy} onClick={()=>action(()=>removeCategory(target.ma,target.loai),()=>{if(value===target.ma&&!allowArchived)onChange('');setMode('manage');})} className="min-h-11 rounded-xl bg-rose-600 px-4 font-semibold text-white">{busy?'Đang xóa…':'Xóa danh mục'}</button></div>
      </>:<form key={mode+':'+(target?.ma||'')} onSubmit={submit} className="space-y-4">
        <label className="block text-sm dark:text-white">Tên danh mục<input name="ten" aria-label="Tên danh mục" required maxLength={50} pattern=".*\S.*" defaultValue={mode==='rename'?target?.ten:''} className={inputStyle}/></label>
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={cancel} className="min-h-11 px-4 text-slate-500">Hủy</button><button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-ink-600 px-4 font-semibold text-white">{busy?'Đang lưu…':mode==='rename'?'Lưu tên':'Thêm danh mục'}</button></div>
      </form>}
      {message&&<p role="alert" className="mt-3 text-sm text-rose-600">{message}</p>}
    </ModalDialog>
  </>;
}
