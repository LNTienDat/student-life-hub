import { withOcrDeadline } from './ocrDeadline';
import { extractImageTimetable, getTimetableColumns, getTimetableGridColumns, imageDay, timeRange, wordsFromOcr } from '../pages/thoikhoabieu/imageImportUtils';
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
  ctx.imageSmoothingQuality = 'high';
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

// Calendar screenshots often have long blank stretches between pale class cards.
// Use each broad tint as a crop hint, then let the OCR parser decide whether it is a class.
function findClassCards({ data, width, height }, column) {
  const left = Math.max(0, column.left);
  const right = Math.min(width, column.right);
  const span = right - left;
  if (span < 30) return [];
  const samples = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84].map(fraction => Math.floor(left + span * fraction));
  const firstY = Math.max(0, Math.ceil(column.top));
  const minHeight = Math.max(20, span * 0.13);
  const allowedGap = Math.max(2, Math.round(span * 0.05));
  const cards = [];
  let start = -1;
  let last = -1;
  for (let y = firstY; y <= height; y++) {
    let tint = 0;
    for (const x of y < height ? samples : []) {
      const pixel = (y * width + x) * 4;
      const r = data[pixel], g = data[pixel + 1], b = data[pixel + 2];
      if (Math.min(r, g, b) >= 183 && Math.max(r, g, b) - Math.min(r, g, b) >= 7) tint++;
    }
    if (tint >= 5) {
      if (start === -1) start = y;
      last = y;
    } else if (start !== -1 && (y - last > allowedGap || y === height)) {
      if (last - start >= minHeight) cards.push({ left, right, top: start, bottom: last + 1 });
      start = -1;
    }
  }
  return cards;
}

function atImageScale(box, scale) {
  return Object.fromEntries(Object.entries(box).map(([key, value]) => [key, value / scale]));
}

function locateRows(rows, { left = 0, top = 0, factor }, fallbackY) {
  return rows.filter(row => row.timeBox || (fallbackY !== undefined && row.tenMon)).map(row => {
    const timeBox = row.timeBox && {
      left: left + row.timeBox.x0 / factor, right: left + row.timeBox.x1 / factor,
      top: top + row.timeBox.y0 / factor, bottom: top + row.timeBox.y1 / factor,
    };
    return { ...row, timeBox, timeY: timeBox?.top ?? fallbackY, ranges: [[row.gioBatDau, row.gioKetThuc]] };
  });
}

function combineRows(rows, alternatives, tolerance, focused = false) {
  for (const candidate of alternatives) {
    const focusedRange = focused ? candidate.ranges[0] : null;
    const match = rows.find(row => Math.abs(row.timeY - candidate.timeY) < tolerance);
    if (!match) {
      rows.push({ ...candidate, focusedRange });
      continue;
    }
    match.ranges.push(...candidate.ranges);
    if (focusedRange) match.focusedRange = focusedRange;
    if ((!match.tenMon || candidate.annotationBeforeTime && !match.annotationBeforeTime) && candidate.tenMon) {
      match.tenMon = candidate.tenMon;
      match.annotationBeforeTime = candidate.annotationBeforeTime;
    }
    if (!match.phongHoc) match.phongHoc = candidate.phongHoc;
    if (!match.giangVien) match.giangVien = candidate.giangVien;
    if (!candidate.selected) {
      match.selected = false;
      match.warning = candidate.warning;
    }
    match.timeBox ||= candidate.timeBox;
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
    let stageStart = 0, stageWidth = 20, reported = 0;
    const ready = createWorker(['vie'], 1, {
      workerPath: base + 'worker.min.js', workerBlobURL: false, corePath: base, langPath: base, gzip: true,
      errorHandler: () => rejectFatal(new Error('Không tải được bộ nhận diện. Kiểm tra mạng rồi thử lại.')),
      logger: event => {
        if (signal?.aborted || event.status !== 'recognizing text') return;
        const next = Math.min(99, Math.round(stageStart + event.progress * stageWidth));
        if (next > reported) onProgress(reported = next);
      },
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
    const gridPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!columns.length) columns = getTimetableGridColumns(gridPixels);
    if (!columns.length) {
      rows.push(...extractImageTimetable(initial));
      texts.push(initial.text);
    }

    const fullWords = wordsFromOcr(initial);
    const setMode = (mode, extra = {}) => whileActive(Promise.race([
      worker.setParameters({ tessedit_pageseg_mode: mode, tessedit_char_whitelist: '', thresholding_method: '0', ...extra }),
      fatal,
    ]), signal);
    const geometryHeaders = new Map();
    const readCrop = async (box, scale, mode, day, { fallbackY, columnIndex } = {}) => {
      const crop = cropImage(bitmap, box, scale, true, true);
      try {
        await setMode(mode);
        const data = await recognize(crop.canvas);
        texts.push(data.text);
        tagColoredNotes(data, crop.canvas);
        if (day === 'unknown' && columnIndex !== undefined) {
          const days = geometryHeaders.get(columnIndex) || new Set();
          for (const word of wordsFromOcr(data)) {
            if (crop.top + word.bbox.y1 / crop.factor > bitmap.height * 0.12) continue;
            const detected = imageDay(word.text);
            if (detected) days.add(detected);
          }
          if (days.size) geometryHeaders.set(columnIndex, days);
        }
        return locateRows(extractImageTimetable(data, day), crop, fallbackY);
      } finally { crop.canvas.width = crop.canvas.height = 1; }
    };
    const tolerance = Math.max(4, Math.min(10, bitmap.height * 0.014));
    for (const [index, column] of columns.entries()) {
      if (rows.length >= 100) break;
      stageStart = 20 + index / columns.length * 75;
      stageWidth = 75 / columns.length;
      const day = column.day || 'unknown';
      const { left, right, top } = column;
      const box = atImageScale({ left, right, top, bottom: canvas.height }, initialScale);
      const smallColumn = box.right - box.left < 145;
      const cards = findClassCards(gridPixels, column).map(card => atImageScale(card, initialScale));
      const columnRows = await readCrop(box, 3, PSM.SINGLE_BLOCK, day, { columnIndex: index });
      combineRows(columnRows, await readCrop(box, 4, PSM.SPARSE_TEXT, day, { columnIndex: index }), tolerance);

      const words = fullWords.filter(({ bbox }) => {
        const x = (bbox.x0 + bbox.x1) / 2;
        return x >= column.left && x < column.right && bbox.y0 >= column.top;
      });
      const fullColumn = { blocks: [{ paragraphs: [{ lines: [{ words }] }] }] };
      combineRows(columnRows, locateRows(extractImageTimetable(fullColumn, day), { factor: initialScale }), tolerance);

      for (const card of cards.slice(0, 12)) {
        // A nearby clean reading already covers this card.
        const inside = columnRows.filter(row => row.timeY >= card.top - tolerance && row.timeY < card.bottom);
        if (!smallColumn && inside.some(row => row.tenMon && row.phongHoc && row.giangVien && confirmedTimeRange(row.ranges))) continue;
        const focus = { ...card, top: Math.max(0, card.top - tolerance) };
        combineRows(columnRows, await readCrop(focus, 6, PSM.SINGLE_BLOCK, day, { fallbackY: inside[0]?.timeY ?? card.top }), tolerance, true);
      }

      for (const [rowIndex, row] of columnRows.sort((a, b) => a.timeY - b.timeY).entries()) {
        if (rows.length >= 100) break;
        let confirmed = confirmedTimeRange(row.ranges);
        const valid = row.ranges.filter(([start, end]) => start < end);
        const startDisagrees = smallColumn && new Set(valid.map(([start]) => start)).size > 1;
        if (row.timeBox && (!confirmed || startDisagrees)) {
          const line = row.timeBox;
          const tightReads = [];
          for (const [padding, scale, threshold] of [[3, 5, '0'], [5, 7, '2'], [4, 8, '1']]) {
            const strip = cropImage(bitmap, {
              left: line.left - padding, right: line.right + padding,
              top: line.top - padding, bottom: line.bottom + padding,
            }, scale, true, true);
            try {
              await setMode(PSM.SINGLE_LINE, { tessedit_char_whitelist: '0123456789:-. ', thresholding_method: threshold });
              const range = timeRange((await recognize(strip.canvas)).text);
              if (range) tightReads.push(range);
            } finally { strip.canvas.width = strip.canvas.height = 1; }
          }
          confirmed = confirmedTimeRange([...row.ranges, ...tightReads]);
          if (startDisagrees) {
            // Several readings of the full column can repeat the same typo in a tiny digit.
            // Trust an isolated card's start only if a clock crop corroborates it and
            // every structurally valid reading already agrees on the end.
            const focus = row.focusedRange;
            const supported = focus && focus[0] < focus[1] && valid.every(([, end]) => end === focus[1]) &&
              tightReads.some(([start]) => start === focus[0]);
            confirmed = confirmedTimeRange(tightReads) || (supported ? focus : null);
          }
        }
        [row.gioBatDau, row.gioKetThuc] = confirmed || ['', ''];
        if (!confirmed) row.timeUncertain = true;
        row.id = `column-${index}-${rowIndex}`;
        delete row.ranges;
        delete row.timeY;
        delete row.focusedRange;
        rows.push(row);
      }
    }
    const geometryAnchors = [...geometryHeaders.entries()];
    const verifiedWeek = geometryAnchors.length >= 2 &&
      geometryAnchors.every(([index, days]) => days.size === 1 && days.has(index + 2));
    for (const row of rows) {
      if (verifiedWeek && !row.thu && row.id.startsWith('column-')) {
        row.thu = Number(row.id.split('-')[1]) + 2;
        if (row.selected) row.warning = '';
      }
      const restored = restoreCourseText(row.tenMon, knownSubjects);
      if (restored !== row.tenMon) row.spellingAdjusted = true;
      row.tenMon = restored;
      delete row.timeBox;
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
