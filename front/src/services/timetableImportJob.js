// One account-scoped draft. Route changes only unsubscribe the view, never cancel OCR.
export function createTimetableImportJob(recognize, urls = URL) {
  let state = { open: false, semester: null, rows: [], text: '', image: '', file: null, busy: false, progress: 0, message: '' };
  let version = 0, controller;
  const listeners = new Set();
  const update = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const cancel = () => { version++; controller?.abort(); update({ busy: false, message: 'Đã dừng đọc ảnh.' }); };
  return {
    snapshot: () => state,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    set: (key, value) => update({ [key]: typeof value === 'function' ? value(state[key]) : value }),
    cancel,
    async read(file, semester, knownSubjects = []) {
      controller?.abort(); const current = ++version; controller = new AbortController();
      if (state.image) urls.revokeObjectURL(state.image);
      update({ open: true, semester, rows: [], text: '', image: urls.createObjectURL(file), file, busy: true, progress: 0, message: '' });
      try {
        const result = await recognize(file, { knownSubjects, signal: controller.signal,
          onProgress: progress => { if (current === version) update({ progress }); } });
        if (current !== version) return;
        update({ rows: result.rows, text: result.text, message: result.rows.length ? `Đã nhận ${result.rows.length} buổi. Kiểm tra từng buổi trước khi lưu.` : 'Chưa nhận ra buổi học. Thử ảnh rõ hơn, dùng AI Vision hoặc thêm dòng.' });
      } catch (error) {
        if (current === version) update({ message: error.message || 'Không đọc được ảnh. Hãy thử lại.' });
      } finally { if (current === version) update({ busy: false }); }
    },
    async startWithAI(file, semester, recognizeAI) {
      controller?.abort(); const current = ++version; controller = new AbortController();
      if (state.image) urls.revokeObjectURL(state.image);
      update({ open: true, semester, rows: [], text: '', image: urls.createObjectURL(file), file, busy: true, progress: 50, message: 'Đang gửi ảnh đến AI Vision để đọc thời khóa biểu…' });
      try {
        const result = await recognizeAI(file, { signal: controller.signal });
        if (current !== version) return;
        update({
          rows: result.rows,
          text: result.text || '',
          progress: 100,
          message: result.rows.length ? `AI Vision đã nhận ${result.rows.length} buổi. Kiểm tra lại trước khi lưu.` : 'AI Vision chưa tìm thấy buổi học rõ ràng trong ảnh này.',
        });
      } catch (error) {
        if (current === version) {
          const fallbackMsg = error?.response?.data?.message || error?.message || 'Chưa quét được bằng AI Vision. Hãy thử lại hoặc quét trên thiết bị.';
          update({ message: fallbackMsg });
        }
      } finally { if (current === version) update({ busy: false }); }
    },
    async readWithAI(recognizeAI) {
      if (!state.file || state.busy) return;
      controller?.abort(); const current = ++version; controller = new AbortController();
      update({ busy: true, progress: 50, message: 'Đang gửi ảnh đến AI Vision để nhận diện chi tiết…' });
      try {
        const result = await recognizeAI(state.file, { signal: controller.signal });
        if (current !== version) return;
        update({
          rows: result.rows,
          text: result.text || '',
          progress: 100,
          message: result.rows.length ? `AI Vision đã nhận ${result.rows.length} buổi. Kiểm tra lại trước khi lưu.` : 'AI Vision chưa tìm thấy buổi học rõ ràng trong ảnh này.',
        });
      } catch (error) {
        if (current === version) {
          const fallbackMsg = error?.response?.data?.message || error?.message || 'Chưa quét được bằng AI Vision. Bạn vẫn có thể sửa tay bên dưới.';
          update({ message: fallbackMsg });
        }
      } finally { if (current === version) update({ busy: false }); }
    },
    dispose() {
      version++; controller?.abort();
      if (state.image) urls.revokeObjectURL(state.image);
      state = { open: false, semester: null, rows: [], text: '', image: '', file: null, busy: false, progress: 0, message: '' };
      listeners.forEach(fn => fn());
    },
  };
}
