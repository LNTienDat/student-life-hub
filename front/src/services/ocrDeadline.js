// Bound both model download and recognition. Always release listeners/timers.
export async function withOcrDeadline(run, parentSignal, milliseconds = 180000) {
  const controller = new AbortController();
  const abort = () => controller.abort(parentSignal.reason);
  if (parentSignal?.aborted) controller.abort(parentSignal.reason);
  else parentSignal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Đọc ảnh quá lâu. Hãy thử ảnh rõ hơn hoặc nhập thủ công.', 'TimeoutError')), milliseconds);
  let rejectAbort;
  const aborted = new Promise((_, reject) => { rejectAbort = () => reject(controller.signal.reason); });
  controller.signal.addEventListener('abort', rejectAbort, { once: true });
  try {
    controller.signal.throwIfAborted();
    return await Promise.race([run(controller.signal), aborted]);
  }
  finally { clearTimeout(timer); controller.signal.removeEventListener('abort', rejectAbort); controller.abort(); parentSignal?.removeEventListener('abort', abort); }
}
