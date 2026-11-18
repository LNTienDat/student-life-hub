import { refineReceipt } from './receiptRecovery';
import { withOcrDeadline } from './ocrDeadline';
import { prepareReceiptImage, prepareReceiptReference } from './receiptPreprocess';
import { extractReceipt, groupReceiptWords, mergeReceiptReadings } from '../pages/taichinh/receiptUtils';
async function recognizeReceiptInternal(file,{signal,onProgress=()=>{}}={}) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  signal?.throwIfAborted();
  let bitmap,worker,canvas,reference;
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
    let progressStart = 0;
    let progressSpan = 60;
    const ready=createWorker(['vie'],1,{workerPath:base+'worker.min.js',workerBlobURL:false,corePath:base,langPath:base,gzip:true,errorHandler:()=>rejectFatal(new Error('Chưa tải được bộ nhận diện hóa đơn.')),logger:event=>{if(!signal?.aborted&&event.status==='recognizing text')onProgress(Math.round(progressStart + event.progress * progressSpan));}});
    ready.then(instance=>{if(signal?.aborted)instance.terminate().catch(() => {});},()=>{});
    worker=await active(Promise.race([ready,fatal]));
    const read = async (target, mode, start, span) => {
      progressStart = start;
      progressSpan = span;
      await active(Promise.race([worker.setParameters({tessedit_pageseg_mode:mode,preserve_interword_spaces:'1',thresholding_method:'0'}),fatal]));
      const { data } = await active(Promise.race([worker.recognize(target, {}, {text:true,blocks:true}),fatal]));
      return extractReceipt(data.text, groupReceiptWords(data.blocks));
    };
    const primary = await read(canvas, PSM.SPARSE_TEXT, 0, 55);
    let receipt = primary;
    if (!primary.hasFinalTotal || !primary.ngayGiaoDich) {
      receipt = await refineReceipt(primary, async () => {
        const alternatives = [await read(canvas, PSM.SINGLE_BLOCK, 55, 15)];
        const preCheck = mergeReceiptReadings(primary, alternatives);
        if ((preCheck.hasFinalTotal || preCheck.computedFromItems) && preCheck.ngayGiaoDich) return alternatives;
        reference = prepareReceiptReference(bitmap);
        alternatives.push(await read(reference, PSM.SPARSE_TEXT, 70, 6));
        let combined = mergeReceiptReadings(primary, alternatives);
        if ((combined.hasFinalTotal || combined.computedFromItems) && combined.ngayGiaoDich) return alternatives;
        alternatives.push(await read(reference, PSM.SINGLE_BLOCK, 76, 6));
        combined = mergeReceiptReadings(primary, alternatives);
        if ((combined.hasFinalTotal || combined.computedFromItems) && combined.ngayGiaoDich) return alternatives;
        try {
          await active(Promise.race([worker.reinitialize(['eng'], 1),fatal]));
          alternatives.push(await read(canvas, PSM.SPARSE_TEXT, 82, 9));
          const comparison = mergeReceiptReadings(primary, alternatives);
          if ((!comparison.hasFinalTotal && !comparison.computedFromItems) || !comparison.ngayGiaoDich) {
            alternatives.push(await read(canvas, PSM.SINGLE_BLOCK, 91, 8));
          }
        } catch (error) {
          signal?.throwIfAborted();
          if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
          // The Vietnamese readings are usable if the optional English model cannot load.
        }
        return alternatives;
      },signal);
    }
    signal?.throwIfAborted();
    const bytes=await file.arrayBuffer();
    const hash=globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''):'';
    signal?.throwIfAborted();
    onProgress(100);
    return {...receipt,anhHoaDonHash:hash};
  }finally{signal?.removeEventListener('abort',stop);await worker?.terminate().catch(() => {});bitmap?.close();if(canvas)canvas.width=canvas.height=1;if(reference)reference.width=reference.height=1;}
}

export function recognizeReceipt(file, options = {}) {
  return withOcrDeadline(signal => recognizeReceiptInternal(file, { ...options, signal }), options.signal);
}
