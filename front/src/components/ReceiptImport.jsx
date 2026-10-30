import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { recognizeReceipt } from '../services/receiptImage';
export default function ReceiptImport({open,onClose,onRecognized}) {
  const input=useRef(null),camera=useRef(null),controller=useRef(null),version=useRef(0);
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState('');
  useEffect(()=>()=>{version.current++;controller.current?.abort();},[]);
  function close(){version.current++;controller.current?.abort();setBusy(false);setMessage('');onClose();}
  async function read(event) {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    controller.current?.abort();const run=++version.current,abort=new AbortController();controller.current=abort;
    setBusy(true);setProgress(0);setMessage('');
    const timer=setTimeout(()=>abort.abort(),120000);
    try{
      const result=await recognizeReceipt(file,{signal:abort.signal,onProgress:value=>{if(run===version.current)setProgress(value);}});
      if(run!==version.current)return;
      onRecognized(result,file);onClose();
    }catch(error){if(run===version.current)setMessage(abort.signal.aborted?'Đã dừng đọc hóa đơn.':error.message||'Chưa đọc được hóa đơn.');}
    finally{clearTimeout(timer);if(run===version.current)setBusy(false);}
  }
  return <ModalDialog open={open} onClose={close} title="Quét hóa đơn" closeLabel={busy?'Dừng quét và đóng':'Đóng'}>
    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Chọn ảnh hoặc chụp hóa đơn. Kiểm tra, sửa số tiền, ngày và danh mục trước khi lưu. Ảnh chỉ được xử lý trong trình duyệt, không tải lên máy chủ.</p>
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button type="button" disabled={busy} onClick={()=>input.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-600 px-4 text-white disabled:opacity-50"><ImagePlus className="h-4 w-4"/>Chọn ảnh hóa đơn</button>
      <button type="button" disabled={busy} onClick={()=>camera.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 dark:border-slate-600 dark:text-white disabled:opacity-50"><Camera className="h-4 w-4"/>Chụp hóa đơn</button>
    </div>
    <input ref={input} type="file" aria-label="Chọn ảnh hóa đơn" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={read} disabled={busy}/>
    <input ref={camera} type="file" aria-label="Chụp hóa đơn" accept="image/png,image/jpeg,image/webp" capture="environment" className="sr-only" onChange={read} disabled={busy}/>
    {busy&&<p role="status" className="mt-4 text-sm text-slate-500">Đang đọc hóa đơn… {progress}%</p>}
    {message&&<p role="alert" className="mt-4 text-sm text-rose-600">{message}</p>}

  </ModalDialog>;
}
