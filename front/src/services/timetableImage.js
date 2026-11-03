import { withOcrDeadline } from './ocrDeadline';
import { extractImageTimetable, getTimetableColumns, getTimetableGridColumns, timeRange } from '../pages/thoikhoabieu/imageImportUtils';
import { confirmedTimeRange, restoreCourseText } from '../pages/thoikhoabieu/ocrTextUtils';

function whileActive(promise, signal) {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Đã dừng đọc ảnh.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
function cropImage(bitmap, box, scale, smoothing = true, removeRed = false) {
  const left = Math.max(0, Math.min(bitmap.width - 1, Math.floor(box.left))), top = Math.max(0, Math.min(bitmap.height - 1, Math.floor(box.top)));
  const width = Math.max(1, Math.min(bitmap.width - left, Math.ceil(box.right - left)));
  const height = Math.max(1, Math.min(bitmap.height - top, Math.ceil(box.bottom - top)));
  const factor = Math.min(scale, 4500 / height, 1800 / width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * factor));
  canvas.height = Math.max(1, Math.round(height * factor));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.drawImage(bitmap, left, top, width, height, 0, 0, canvas.width, canvas.height);
  if (removeRed) {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Ignore the calendar's red current-time cursor, which often crosses printed class times.
    const isRed = i => image.data[i] > 150 && image.data[i] > image.data[i + 1] * 1.35 && image.data[i] > image.data[i + 2] * 1.35;
    for (let y = 0; y < canvas.height; y++) {
      const start = y * canvas.width * 4;
      let count = 0;
      for (let x = 0; x < canvas.width; x++) if (isRed(start + x * 4)) count++;
      // Only remove long horizontal strokes, preserving red/orange cancellation notices and course text.
      if (count < canvas.width * 0.6) continue;
      for (let x = 0; x < canvas.width; x++) {
        const i = start + x * 4;
        if (isRed(i)) image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  return { canvas, factor, left, top };
}

function tagColoredNotes(data, canvas) {
  const ctx = canvas.getContext('2d');
  for (const block of data.blocks || []) for (const paragraph of block.paragraphs || [])
    for (const line of paragraph.lines || []) for (const word of line.words || []) {
      if (!word.bbox) continue;
      const left = Math.max(0, word.bbox.x0), top = Math.max(0, word.bbox.y0);
      const width = Math.min(canvas.width - left, word.bbox.x1 - left);
      const height = Math.min(canvas.height - top, word.bbox.y1 - top);
      if (width <= 0 || height <= 0) continue;
      const pixels = ctx.getImageData(left, top, width, height).data;
      let foreground = 0, orange = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
        if (Math.min(r, g, b) >= 180) continue;
        foreground++;
        if (r > 100 && r > g * 1.25 && g > b * 1.2) orange++;
      }
      word.coloredNote = orange > 5 && orange > foreground * 0.2;
    }
}
async function recognizeTimetableInternal(file, { signal, onProgress = () => {}, knownSubjects = [] } = {}) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
  signal?.throwIfAborted();
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('Không mở được ảnh. Hãy chọn ảnh JPG, PNG hoặc WebP khác.'); }
  let worker, canvas, rejectFatal;
  const stop = () => { worker?.terminate().catch(() => {}); };
  signal?.addEventListener('abort', stop, { once: true });
  try {
    if (bitmap.width * bitmap.height > 30_000_000 || bitmap.width < 100 || bitmap.height < 100) throw new Error('Ảnh quá lớn hoặc quá nhỏ. Hãy chụp rõ phần thời khóa biểu.');
    const { createWorker, PSM } = await import('tesseract.js');
    const base = new URL('/ocr/v7/', window.location.origin).href;
    const fatal = new Promise((_, reject) => { rejectFatal = reject; });
    let stageStart = 0, stageWidth = 20;
    const ready = createWorker(['vie'], 1, {
      workerPath: base + 'worker.min.js', workerBlobURL: false, corePath: base, langPath: base, gzip: true,
      errorHandler: () => rejectFatal(new Error('Không tải được bộ nhận diện. Kiểm tra mạng rồi thử lại.')),
      logger: event => { if (!signal?.aborted && event.status === 'recognizing text') onProgress(Math.min(99, Math.round(stageStart + event.progress * stageWidth))); },
    });
    ready.then(instance => { if (signal?.aborted) instance.terminate().catch(() => {}); }, () => {});
    worker = await whileActive(Promise.race([ready, fatal]), signal);
    const recognize = async target => {
      signal?.throwIfAborted();
      return (await whileActive(Promise.race([worker.recognize(target, {}, { text: true, blocks: true }), fatal]), signal)).data;
    };
    const initialScale = Math.min(2, 3000 / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * initialScale); canvas.height = Math.round(bitmap.height * initialScale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: '1' });
    const initial = await recognize(canvas);
    let columns = getTimetableColumns(initial);
    {
      // Read the small weekday header separately: full-grid OCR can merge or omit it.
      const header = document.createElement('canvas');
      const factor = Math.min(6, 6000 / bitmap.width);
      header.width = Math.round(bitmap.width * factor);
      header.height = Math.round(bitmap.height * 0.12 * factor);
      try {
        const context = header.getContext('2d');
        context.fillStyle = '#fff'; context.fillRect(0, 0, header.width, header.height);
        context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height * 0.12, 0, 0, header.width, header.height);
        const reading = await recognize(header);
        initial.headerText = reading.text;
        let headerColumns = getTimetableColumns(reading);
        if (!headerColumns.length) {
          let headerWorker;
          try {
            const readyHeader = createWorker(['eng'], 1, { workerPath: base + 'worker.min.js', workerBlobURL: false, corePath: base, langPath: base, gzip: true, errorHandler: () => rejectFatal(new Error('Chưa đọc được hàng thứ.')) });
            readyHeader.then(instance => { if (signal?.aborted) instance.terminate().catch(() => {}); }, () => {});
            headerWorker = await whileActive(Promise.race([readyHeader, fatal]), signal);
            await headerWorker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
            const english = await whileActive(Promise.race([headerWorker.recognize(header, {}, { text: true, blocks: true }), fatal]), signal);
            headerColumns = getTimetableColumns(english.data);
            if (!headerColumns.length) {
              await headerWorker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
              const block = await whileActive(Promise.race([headerWorker.recognize(header, {}, { text: true, blocks: true }), fatal]), signal);
              headerColumns = getTimetableColumns(block.data);
            }
          } finally { await headerWorker?.terminate().catch(() => {}); }
        }
        if (headerColumns.length) columns = headerColumns.map(column => ({ ...column,
          left: column.left / factor * initialScale, right: column.right / factor * initialScale,
          top: column.top / factor * initialScale }));
      } finally { header.width = header.height = 1; }
    }
    const rows = [], texts = [initial.headerText || ''];
    if (!columns.length) columns = getTimetableGridColumns(ctx.getImageData(0,0,canvas.width,canvas.height));
    if (columns.length) {
      for (let index = 0; index < columns.length; index++) {
        const column = columns[index];
        stageStart = 20 + index / columns.length * 75; stageWidth = 75 / columns.length;
        const crop = cropImage(bitmap, { left: column.left / initialScale, right: column.right / initialScale, top: column.top / initialScale, bottom: bitmap.height }, 3, true, true);
        try {
          await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, tessedit_char_whitelist: '' });
          const data = await recognize(crop.canvas); texts.push(data.text);
          tagColoredNotes(data, crop.canvas);
          const parsed = extractImageTimetable(data, column.day || 'unknown');

          // A small colored note or a room code can disappear in block segmentation.
          // Read that column once more with separated lines; only replace fields whose
          // second reading has structural evidence (note label or a valid room line).
          {
            const detail = cropImage(bitmap, { left: crop.left, right: column.right / initialScale, top: crop.top, bottom: bitmap.height }, 4, true, true);
            try {
              await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: '' });
              const secondData = await recognize(detail.canvas);
              texts.push(secondData.text);
              const alternatives = extractImageTimetable(secondData, column.day || 'unknown');
              for (const row of parsed) {
                if (!row.timeBox) continue;
                const match = alternatives.find(item => item.timeBox &&
                  Math.abs(item.timeBox.y0 / detail.factor - row.timeBox.y0 / crop.factor) < 8);
                if (!match) continue;
                if ((!row.tenMon && match.tenMon) || (match.annotationBeforeTime && !row.annotationBeforeTime)) {
                  row.tenMon = match.tenMon;
                  row.annotationBeforeTime = true;
                }
                if (!row.phongHoc && match.phongHoc) row.phongHoc = match.phongHoc;
                row.alternateRange = [match.gioBatDau, match.gioKetThuc];
              }
              // Block OCR can omit a whole class, especially in sparse weekly calendars.
              // Recover only spatially distinct sessions; never merge two neighboring courses.
              for (const alternative of alternatives) {
                if (!alternative.timeBox || parsed.some(row => row.timeBox && Math.abs(row.timeBox.y0 / crop.factor - alternative.timeBox.y0 / detail.factor) < 8)) continue;
                const factor = crop.factor / detail.factor;
                parsed.push({ ...alternative, id: alternative.id + '-detail', timeBox: Object.fromEntries(Object.entries(alternative.timeBox).map(([key, value]) => [key, value * factor])) });
              }
              parsed.sort((a,b)=>(a.timeBox?.y0 ?? 0)-(b.timeBox?.y0 ?? 0));
            } finally { detail.canvas.width = detail.canvas.height = 1; }
          }
          for (const row of parsed) {
            if (!column.day) { row.thu=''; row.warning='Chưa đọc chắc thứ. Đã tách theo cột; hãy chọn thứ theo ảnh gốc.'; }
            row.id = `column-${index}-${row.id}`;
            if (row.timeBox) {
              const box = { left: crop.left + row.timeBox.x0 / crop.factor - 3, right: crop.left + row.timeBox.x1 / crop.factor + 3,
                top: crop.top + row.timeBox.y0 / crop.factor - 3, bottom: crop.top + row.timeBox.y1 / crop.factor + 3 };
              const ranges = [[row.gioBatDau, row.gioKetThuc]];
              await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, tessedit_char_whitelist: '0123456789:-. ' });
              for (const [scale, smoothing] of [[3, false], [4, true]]) {
                const strip = cropImage(bitmap, box, scale, smoothing, true);
                try { ranges.push(timeRange((await recognize(strip.canvas)).text)); }
                finally { strip.canvas.width = strip.canvas.height = 1; }
              }
              let confirmed = confirmedTimeRange(ranges);
              if (!confirmed) {
                const wider = { left: box.left, right: Math.min(bitmap.width, box.right + 60), top: Math.max(0, box.top - 6), bottom: Math.min(bitmap.height, box.bottom + 2) };
                for (const [scale, smoothing] of [[3, false], [4, true]]) {
                  const strip = cropImage(bitmap, wider, scale, smoothing, true);
                  try { ranges.push(timeRange((await recognize(strip.canvas)).text)); }
                  finally { strip.canvas.width = strip.canvas.height = 1; }
                }
                confirmed = confirmedTimeRange(ranges);
              }
              if (confirmed && row.alternateRange && confirmed.join('|') !== row.alternateRange.join('|')) confirmed = null;
              [row.gioBatDau, row.gioKetThuc] = confirmed || ['', ''];
              if (!confirmed) row.timeUncertain = true;
            }
            rows.push(row);
          }
        } finally { crop.canvas.width = crop.canvas.height = 1; }
      }
    } else { rows.push(...extractImageTimetable(initial)); texts.push(initial.text); }
    for (const row of rows) {
      const restored = restoreCourseText(row.tenMon, knownSubjects);
      if (restored !== row.tenMon) row.spellingAdjusted = true;
      row.tenMon = restored;
      delete row.timeBox;
      delete row.alternateRange;
      delete row.annotationBeforeTime;
    }
    signal?.throwIfAborted(); onProgress(100);
    return { rows: rows.slice(0, 100), text: texts.join('\n\n') };
  } finally {
    signal?.removeEventListener('abort', stop);
    await worker?.terminate().catch(() => {});
    bitmap.close();
    if (canvas) canvas.width = canvas.height = 1;
  }
}

export function recognizeTimetable(file, options = {}) {
  return withOcrDeadline(signal => recognizeTimetableInternal(file, { ...options, signal }), options.signal);
}
