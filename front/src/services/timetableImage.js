import { extractImageTimetable } from '../pages/thoikhoabieu/imageImportUtils';

function whileActive(promise, signal) {
  if(!signal)return promise;
  signal.throwIfAborted();
  return new Promise((resolve,reject)=>{
    const abort=()=>reject(new DOMException('Đã dừng đọc ảnh.','AbortError'));
    signal.addEventListener('abort',abort,{once:true});
    promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
  });
}

export async function recognizeTimetable(file, { signal, onProgress = () => {} } = {}) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>10*1024*1024) throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  signal?.throwIfAborted();
  let bitmap;
  try { bitmap=await createImageBitmap(file); } catch { throw new Error('Không mở được ảnh. Hãy chọn ảnh JPG, PNG hoặc WebP khác.'); }
  let canvas;
  try {
    if(bitmap.width*bitmap.height>30_000_000 || bitmap.width<100 || bitmap.height<100)throw new Error('Ảnh quá lớn hoặc quá nhỏ. Hãy chụp rõ phần thời khóa biểu.');
    const scale=Math.min(2,3000/Math.max(bitmap.width,bitmap.height));
    canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  } finally {bitmap.close();}
  const { createWorker, PSM }=await import('tesseract.js');
  signal?.throwIfAborted();
  const base=new URL('/ocr/v7/',window.location.origin).href;
  let worker;
  const stop=()=>{worker?.terminate().catch(()=>{});};
  signal?.addEventListener('abort',stop,{once:true});
  try {
    let rejectFatal;
    const fatal=new Promise((_,reject)=>{rejectFatal=reject;});
    const ready=createWorker(['vie','eng'],1,{workerPath:base+'worker.min.js',workerBlobURL:false,corePath:base,langPath:base,gzip:true,errorHandler:()=>rejectFatal(new Error('Không tải được bộ nhận diện. Kiểm tra mạng rồi thử lại.')),logger:event=>{if(!signal?.aborted)onProgress(event.status==='recognizing text'?Math.round(event.progress*100):0);}});
    ready.then(instance=>{if(signal?.aborted)instance.terminate();},()=>{});
    worker=await whileActive(Promise.race([ready,fatal]),signal);
    signal?.throwIfAborted();
    await whileActive(worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:'1'}),signal);
    const result=await whileActive(Promise.race([worker.recognize(canvas,{}, {text:true,blocks:true}),fatal]),signal);
    signal?.throwIfAborted();
    return {rows:extractImageTimetable(result.data),text:result.data.text};
  } finally {signal?.removeEventListener('abort',stop);await worker?.terminate();canvas.width=canvas.height=1;}
}
