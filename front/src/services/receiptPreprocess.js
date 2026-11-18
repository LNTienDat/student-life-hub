function isShadowPaper(data, offset) {
  const r = data[offset], g = data[offset + 1], b = data[offset + 2];
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min > 70 && max - min < 55 && (r + g + b) / 3 > 90;
}

// Extend detected bright paper upward and downward through shadowed paper rows.
function extendVerticalPaper(data, width, height, box) {
  const { left, right } = box;
  const span = right - left;
  if (span <= 0) return box;
  const step = Math.max(1, Math.floor(span / 40));
  const rowCoverage = (y) => {
    let hits = 0, total = 0;
    const rowOffset = y * width * 4;
    for (let x = left; x < right; x += step) {
      total++;
      if (isShadowPaper(data, rowOffset + x * 4)) hits++;
    }
    return total > 0 && hits >= total * 0.5 ? hits / total : 0;
  };
  const maxGap = Math.max(2, Math.floor(height * 0.015));
  let top = box.top, bottom = box.bottom, addedArea = 0;
  for (let y = top - 1, gap = 0, pending = 0; y >= 0 && gap <= maxGap; y--) {
    const cov = rowCoverage(y);
    if (cov > 0) {
      top = y;
      addedArea += pending + cov * span;
      gap = 0;
      pending = 0;
    } else {
      gap++;
      pending += 0.35 * span;
    }
  }
  for (let y = bottom, gap = 0, pending = 0; y < height && gap <= maxGap; y++) {
    const cov = rowCoverage(y);
    if (cov > 0) {
      bottom = y + 1;
      addedArea += pending + cov * span;
      gap = 0;
      pending = 0;
    } else {
      gap++;
      pending += 0.35 * span;
    }
  }
  return { left, right, top, bottom, area: box.area + addedArea };
}

function findLargestConnectedRegion(data, width, height, { minChannel, maxDiff, minAvg }) {
  const mask = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  for (let i = 0; i < mask.length; i++) {
    const n = i * 4, r = data[n], g = data[n + 1], b = data[n + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    if (lo > minChannel && hi - lo < maxDiff && (r + g + b) / 3 > minAvg) mask[i] = 1;
  }
  let best = null;
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] !== 1) continue;
    let head = 0, tail = 0, left = width, right = 0, top = height, bottom = 0;
    mask[start] = 2;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x > 0 && mask[index - 1] === 1) { mask[index - 1] = 2; queue[tail++] = index - 1; }
      if (x + 1 < width && mask[index + 1] === 1) { mask[index + 1] = 2; queue[tail++] = index + 1; }
      if (y > 0 && mask[index - width] === 1) { mask[index - width] = 2; queue[tail++] = index - width; }
      if (y + 1 < height && mask[index + width] === 1) { mask[index + width] = 2; queue[tail++] = index + width; }
    }
    if (!best || tail > best.area) best = { left, right: right + 1, top, bottom: bottom + 1, area: tail };
  }
  return best;
}

// Find a large, connected light paper region (with dim indoor fallback); fall back to full image when uncertain.
export function findReceiptPaper({ data, width, height }) {
  const full = { left: 0, top: 0, right: width, bottom: height };
  const thresholds = [
    { minChannel: 110, maxDiff: 60, minAvg: 135 },
    { minChannel: 80, maxDiff: 48, minAvg: 95 },
  ];
  for (const criteria of thresholds) {
    const best = findLargestConnectedRegion(data, width, height, criteria);
    if (!best || best.area < width * height * 0.08 || (best.right - best.left) < width * 0.25) continue;
    const extended = extendVerticalPaper(data, width, height, best);
    const boxArea = (extended.right - extended.left) * (extended.bottom - extended.top);
    if (extended.area < width * height * 0.18 || (extended.bottom - extended.top) < height * 0.3 || extended.area < boxArea * 0.55) {
      continue;
    }
    const pad = Math.ceil(Math.max(width, height) * 0.035);
    return {
      left: Math.max(0, extended.left - pad),
      right: Math.min(width, extended.right + pad),
      top: Math.max(0, extended.top - pad),
      bottom: Math.min(height, extended.bottom + pad),
    };
  }
  return full;
}

function normalizeIllumination(grays, width, height) {
  const cell = Math.max(32, Math.floor(Math.min(width, height) / 12));
  const cols = Math.max(2, Math.ceil(width / cell));
  const rows = Math.max(2, Math.ceil(height / cell));
  const grid = new Float32Array(rows * cols);
  const hist = new Uint32Array(256);
  for (let gy = 0; gy < rows; gy++) {
    const y0 = Math.floor((gy * height) / rows);
    const y1 = Math.floor(((gy + 1) * height) / rows);
    for (let gx = 0; gx < cols; gx++) {
      const x0 = Math.floor((gx * width) / cols);
      const x1 = Math.floor(((gx + 1) * width) / cols);
      hist.fill(0);
      let samples = 0;
      const step = Math.max(1, Math.floor(Math.min(x1 - x0, y1 - y0) / 16));
      for (let y = y0; y < y1; y += step) {
        const rowOff = y * width;
        for (let x = x0; x < x1; x += step) {
          hist[grays[rowOff + x]]++;
          samples++;
        }
      }
      const target = Math.max(1, Math.floor(samples * 0.85));
      let acc = 0, bg = 240;
      for (let v = 0; v < 256; v++) {
        acc += hist[v];
        if (acc >= target) { bg = v; break; }
      }
      grid[gy * cols + gx] = Math.max(48, bg);
    }
  }
  for (let y = 0; y < height; y++) {
    const fy = Math.min(rows - 1.0001, Math.max(0, ((y + 0.5) * rows) / height - 0.5));
    const gy0 = Math.floor(fy), gy1 = Math.min(rows - 1, gy0 + 1), ty = fy - gy0;
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      const fx = Math.min(cols - 1.0001, Math.max(0, ((x + 0.5) * cols) / width - 0.5));
      const gx0 = Math.floor(fx), gx1 = Math.min(cols - 1, gx0 + 1), tx = fx - gx0;
      const top = grid[gy0 * cols + gx0] * (1 - tx) + grid[gy0 * cols + gx1] * tx;
      const bot = grid[gy1 * cols + gx0] * (1 - tx) + grid[gy1 * cols + gx1] * tx;
      const bg = top * (1 - ty) + bot * ty;
      grays[rowOff + x] = Math.max(0, Math.min(255, Math.round((grays[rowOff + x] * 245) / bg)));
    }
  }
}

/**
 * Integral-image Sauvola adaptive binarization for shadowed or faint thermal receipts.
 * Preserves sharp strokes across uneven lighting without global histogram clipping.
 */
export function sauvolaThreshold(grays, width, height, { radius, k = 0.18, minStd = 6 } = {}) {
  const r = radius ?? Math.max(10, Math.min(28, Math.floor(Math.min(width, height) / 40)));
  const stride = width + 1;
  const sum = new Float64Array((height + 1) * stride);
  const sumSq = new Float64Array((height + 1) * stride);
  for (let y = 0; y < height; y++) {
    let rowSum = 0, rowSq = 0;
    const gOff = y * width, sOff = (y + 1) * stride, pOff = y * stride;
    for (let x = 0; x < width; x++) {
      const v = grays[gOff + x];
      rowSum += v;
      rowSq += v * v;
      sum[sOff + x + 1] = sum[pOff + x + 1] + rowSum;
      sumSq[sOff + x + 1] = sumSq[pOff + x + 1] + rowSq;
    }
  }
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(height, y + r + 1);
    const r0 = y0 * stride, r1 = y1 * stride, rowOff = y * width;
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(width, x + r + 1);
      const count = (y1 - y0) * (x1 - x0);
      const s = sum[r1 + x1] - sum[r0 + x1] - sum[r1 + x0] + sum[r0 + x0];
      const sq = sumSq[r1 + x1] - sumSq[r0 + x1] - sumSq[r1 + x0] + sumSq[r0 + x0];
      const mean = s / count;
      const variance = Math.max(0, sq / count - mean * mean);
      const std = Math.sqrt(variance);
      const val = grays[rowOff + x];
      if (std < minStd && val >= mean - 10) {
        out[rowOff + x] = 255;
      } else {
        const threshold = mean * (1 + k * (std / 128 - 1));
        out[rowOff + x] = val < threshold ? 0 : 255;
      }
    }
  }
  return out;
}

function cropAndGrayscale(bitmap) {
  const sample = document.createElement('canvas');
  const ratio = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  sample.width = Math.round(bitmap.width * ratio);
  sample.height = Math.round(bitmap.height * ratio);
  const small = sample.getContext('2d', { willReadFrequently: true });
  small.drawImage(bitmap, 0, 0, sample.width, sample.height);
  const box = findReceiptPaper(small.getImageData(0, 0, sample.width, sample.height));
  const x = box.left / ratio, y = box.top / ratio;
  const w = (box.right - box.left) / ratio, h = (box.bottom - box.top) / ratio;
  const scale = Math.min(3, 1600 / w, 3600 / h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, x, y, w, h, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const values = image.data;
  const pixels = canvas.width * canvas.height;
  const grays = new Uint8Array(pixels);
  for (let i = 0, p = 0; i < values.length; i += 4, p++) {
    grays[p] = Math.round(values[i] * 0.299 + values[i + 1] * 0.587 + values[i + 2] * 0.114);
  }
  normalizeIllumination(grays, canvas.width, canvas.height);
  sample.width = sample.height = 1;
  return { canvas, ctx, image, grays, pixels };
}

export function prepareReceiptImage(bitmap) {
  const { canvas, ctx, image, grays, pixels } = cropAndGrayscale(bitmap);
  const values = image.data;
  const hist = new Uint32Array(256);
  for (let p = 0; p < pixels; p++) hist[grays[p]]++;
  let count = 0, low = 0, high = 255;
  for (let i = 0; i < 256; i++) { count += hist[i]; if (count >= pixels * 0.015) { low = i; break; } }
  count = 0;
  for (let i = 255; i >= 0; i--) { count += hist[i]; if (count >= pixels * 0.08) { high = i; break; } }
  const span = high - low > 35 ? high - low : 255, base = high - low > 35 ? low : 0;
  for (let i = 0, p = 0; i < values.length; i += 4, p++) {
    const gray = Math.max(0, Math.min(255, Math.round(((grays[p] - base) * 255) / span)));
    values[i] = values[i + 1] = values[i + 2] = gray;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Produce a high-contrast Sauvola-binarized receipt canvas for difficult shadows/thermal ink. */
export function prepareReceiptBinary(bitmap) {
  const { canvas, ctx, image, grays } = cropAndGrayscale(bitmap);
  const binary = sauvolaThreshold(grays, canvas.width, canvas.height);
  const values = image.data;
  for (let i = 0, p = 0; i < values.length; i += 4, p++) {
    values[i] = values[i + 1] = values[i + 2] = binary[p];
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Rotate a source canvas or bitmap by 90 or 270 degrees for sideways photos missing EXIF orientation. */
export function rotateReceiptSource(source, degrees = 90) {
  const out = document.createElement('canvas');
  const w = source.width, h = source.height;
  out.width = h;
  out.height = w;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);
  return out;
}

// Keep the source scale for small, sharp receipts. Enlarging a grid can merge its lines with digits.
export function prepareReceiptReference(bitmap) {
  const scale = Math.min(1, 1600 / bitmap.width, 3600 / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}
