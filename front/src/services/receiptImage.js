import { refineReceipt } from './receiptRecovery';
import { withOcrDeadline } from './ocrDeadline';
import { prepareReceiptImage } from './receiptPreprocess';
import { extractReceipt } from '../pages/taichinh/receiptUtils';
async function recognizeReceiptInternal(file,{signal,onProgress=()=>{}}={}) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  signal?.throwIfAborted();
  let bitmap,worker,canvas;
  const stop=()=>{worker?.terminate().catch(()=>{});};
  signal?.addEventListener('abort',stop,{once:true});
  const active=promise=>{
    if(!signal)return promise;
    signal.throwIfAborted();
    return new Promise((resolve,reject)=>{
      const abort=()=>reject(new DOMException('Đã dừng đọc hóa đơn.','AbortError'));
      signal.addEventListener('abort',abort,{once:true});
      promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
    });
  };
  try {
    try{bitmap=await createImageBitmap(file);}catch{throw new Error('Không mở được ảnh hóa đơn.');}
    if(bitmap.width<100||bitmap.height<100||bitmap.width*bitmap.height>30000000)throw new Error('Ảnh quá nhỏ hoặc quá lớn. Hãy chụp rõ phần hóa đơn.');
    canvas=prepareReceiptImage(bitmap);
    const {createWorker,PSM}=await import('tesseract.js');
    const base=new URL('/ocr/v7/',window.location.origin).href;
    let rejectFatal;const fatal=new Promise((_,reject)=>{rejectFatal=reject;});
    const ready=createWorker(['vie'],1,{workerPath:base+'worker.min.js',workerBlobURL:false,corePath:base,langPath:base,gzip:true,errorHandler:()=>rejectFatal(new Error('Chưa tải được bộ nhận diện hóa đơn.')),logger:event=>{if(!signal?.aborted&&event.status==='recognizing text')onProgress(Math.round(event.progress*100));}});
    ready.then(instance=>{if(signal?.aborted)instance.terminate().catch(() => {});},()=>{});
    worker=await active(Promise.race([ready,fatal]));
    await active(worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_COLUMN,preserve_interword_spaces:'1',thresholding_method:'2'}));
    const result=await active(Promise.race([worker.recognize(canvas),fatal]));
    let receipt=extractReceipt(result.data.text);
    if(!receipt.hasFinalTotal || !receipt.ngayGiaoDich) {
      receipt=await refineReceipt(receipt,async()=>{
        await worker.terminate().catch(()=>{});worker=null;
        const englishReady=createWorker(['eng'],1,{workerPath:base+'worker.min.js',workerBlobURL:false,corePath:base,langPath:base,gzip:true,errorHandler:()=>rejectFatal(new Error('Chưa tải được bộ nhận diện hóa đơn.'))});
        englishReady.then(instance=>{if(signal?.aborted)instance.terminate().catch(()=>{});},()=>{});
        worker=await active(Promise.race([englishReady,fatal]));
        const alternatives=[];
        for(const mode of [PSM.SINGLE_COLUMN,PSM.SINGLE_BLOCK]){
          await active(worker.setParameters({tessedit_pageseg_mode:mode,preserve_interword_spaces:'1',thresholding_method:'2'}));
          const reading=await active(Promise.race([worker.recognize(canvas),fatal]));
          alternatives.push(extractReceipt(reading.data.text));
        }
        return alternatives;
      },signal);
    }
    signal?.throwIfAborted();
    const bytes=await file.arrayBuffer();
    const hash=globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''):'';
    signal?.throwIfAborted();
    return {...receipt,anhHoaDonHash:hash};
  }finally{signal?.removeEventListener('abort',stop);await worker?.terminate().catch(() => {});bitmap?.close();if(canvas)canvas.width=canvas.height=1;}
}

export function recognizeReceipt(file, options = {}) {
  return withOcrDeadline(signal => recognizeReceiptInternal(file, { ...options, signal }), options.signal);
}
