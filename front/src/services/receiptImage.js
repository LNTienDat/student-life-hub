import { refineReceipt } from './receiptRecovery';
import { withOcrDeadline } from './ocrDeadline';
import { prepareReceiptImage, prepareReceiptBinary, prepareReceiptReference, rotateReceiptSource } from './receiptPreprocess';
import { extractReceipt, groupReceiptWords, mergeReceiptReadings } from '../pages/taichinh/receiptUtils';

const isDone = (reading) => (reading.hasFinalTotal || reading.computedFromItems) && Boolean(reading.ngayGiaoDich);

async function recognizeReceiptInternal(file, { signal, onProgress = () => {} } = {}) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  }
  signal?.throwIfAborted();
  let bitmap, worker, canvas, binaryCanvas, reference, rotated;
  const stop = () => { worker?.terminate().catch(() => {}); };
  signal?.addEventListener('abort', stop, { once: true });

  const active = (promise) => {
    if (!signal) return promise;
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException('Đã dừng đọc hóa đơn.', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
  };

  try {
    try { bitmap = await createImageBitmap(file); } catch { throw new Error('Không mở được ảnh hóa đơn.'); }
    if (bitmap.width < 100 || bitmap.height < 100 || bitmap.width * bitmap.height > 30000000) {
      throw new Error('Ảnh quá nhỏ hoặc quá lớn. Hãy chụp rõ phần hóa đơn.');
    }

    canvas = prepareReceiptImage(bitmap);
    const { createWorker, PSM } = await import('tesseract.js');
    const base = new URL('/ocr/v7/', window.location.origin).href;
    let rejectFatal;
    const fatal = new Promise((_, reject) => { rejectFatal = reject; });
    let progressStart = 0;
    let progressSpan = 45;

    const ready = createWorker(['vie'], 1, {
      workerPath: `${base}worker.min.js`,
      workerBlobURL: false,
      corePath: base,
      langPath: base,
      gzip: true,
      errorHandler: () => rejectFatal(new Error('Chưa tải được bộ nhận diện hóa đơn.')),
      logger: (event) => {
        if (!signal?.aborted && event.status === 'recognizing text') {
          onProgress(Math.round(progressStart + event.progress * progressSpan));
        }
      },
    });
    ready.then((instance) => { if (signal?.aborted) instance.terminate().catch(() => {}); }, () => {});
    worker = await active(Promise.race([ready, fatal]));

    const read = async (target, mode, start, span) => {
      progressStart = start;
      progressSpan = span;
      await active(Promise.race([
        worker.setParameters({ tessedit_pageseg_mode: mode, preserve_interword_spaces: '1', thresholding_method: '0' }),
        fatal,
      ]));
      const { data } = await active(Promise.race([worker.recognize(target, {}, { text: true, blocks: true }), fatal]));
      return extractReceipt(data.text, groupReceiptWords(data.blocks));
    };

    const primary = await read(canvas, PSM.SPARSE_TEXT, 0, 45);
    let receipt = primary;

    if (!primary.hasFinalTotal || !primary.ngayGiaoDich) {
      receipt = await refineReceipt(primary, async () => {
        const alternatives = [await read(canvas, PSM.SINGLE_BLOCK, 45, 13)];
        let combined = mergeReceiptReadings(primary, alternatives);
        if (isDone(combined)) return alternatives;

        // Sauvola adaptive binarization recovers shadowed or faint thermal ink that linear stretch misses.
        binaryCanvas = prepareReceiptBinary(bitmap);
        alternatives.push(await read(binaryCanvas, PSM.SPARSE_TEXT, 58, 12));
        combined = mergeReceiptReadings(primary, alternatives);
        if (isDone(combined)) return alternatives;

        alternatives.push(await read(binaryCanvas, PSM.SINGLE_BLOCK, 70, 8));
        combined = mergeReceiptReadings(primary, alternatives);
        if (isDone(combined)) return alternatives;

        reference = prepareReceiptReference(bitmap);
        alternatives.push(await read(reference, PSM.SPARSE_TEXT, 78, 4));
        combined = mergeReceiptReadings(primary, alternatives);
        if (isDone(combined)) return alternatives;

        alternatives.push(await read(reference, PSM.SINGLE_BLOCK, 82, 4));
        combined = mergeReceiptReadings(primary, alternatives);
        if (isDone(combined)) return alternatives;

        try {
          await active(Promise.race([worker.reinitialize(['eng'], 1), fatal]));
          alternatives.push(await read(canvas, PSM.SPARSE_TEXT, 86, 4));
          combined = mergeReceiptReadings(primary, alternatives);
          if (!isDone(combined)) {
            alternatives.push(await read(binaryCanvas, PSM.SPARSE_TEXT, 90, 4));
          }
        } catch (error) {
          signal?.throwIfAborted();
          if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
        }

        combined = mergeReceiptReadings(primary, alternatives);
        if (!combined.soTien && !combined.ngayGiaoDich && bitmap.width > bitmap.height * 1.15) {
          try {
            await active(Promise.race([worker.reinitialize(['vie'], 1), fatal]));
            for (const [index, angle] of [90, 270].entries()) {
              rotated = rotateReceiptSource(canvas, angle);
              alternatives.push(await read(rotated, PSM.SPARSE_TEXT, 94 + index * 2, 2));
              rotated.width = rotated.height = 1;
              rotated = null;
              if (isDone(mergeReceiptReadings(primary, alternatives))) break;
            }
          } catch (error) {
            signal?.throwIfAborted();
            if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
          }
        }
        return alternatives;
      }, signal);
    }

    signal?.throwIfAborted();
    const bytes = await file.arrayBuffer();
    const hash = globalThis.crypto?.subtle
      ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) => b.toString(16).padStart(2, '0')).join('')
      : '';
    signal?.throwIfAborted();
    onProgress(100);
    return { ...receipt, anhHoaDonHash: hash };
  } finally {
    signal?.removeEventListener('abort', stop);
    await worker?.terminate().catch(() => {});
    bitmap?.close();
    for (const c of [canvas, binaryCanvas, reference, rotated]) {
      if (c) { c.width = 1; c.height = 1; }
    }
  }
}

export function recognizeReceipt(file, options = {}) {
  return withOcrDeadline((signal) => recognizeReceiptInternal(file, { ...options, signal }), options.signal);
}
