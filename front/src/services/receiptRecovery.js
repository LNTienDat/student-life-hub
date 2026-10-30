import { mergeReceiptReadings } from '../pages/taichinh/receiptUtils.js';

// A failed optional second reading must not discard the usable first reading.
export async function refineReceipt(primary, readAlternatives, signal) {
  signal?.throwIfAborted();
  try {
    const alternatives = await readAlternatives();
    signal?.throwIfAborted();
    return mergeReceiptReadings(primary, alternatives);
  } catch (error) {
    signal?.throwIfAborted();
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
    return { ...primary, warnings: [...primary.warnings, 'Chưa đọc đối chiếu được. Hãy kiểm tra số tiền và ngày theo ảnh trước khi lưu.'] };
  }
}
