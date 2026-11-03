// One account-scoped draft. Route changes only unsubscribe the view, never cancel OCR.
export function createTimetableImportJob(recognize, urls = URL) {
  let state = { open: false, semester: null, rows: [], text: '', image: '', busy: false, progress: 0, message: '' };
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
      update({ open: true, semester, rows: [], text: '', image: urls.createObjectURL(file), busy: true, progress: 0, message: '' });
      try {
        const result = await recognize(file, { knownSubjects, signal: controller.signal,
          onProgress: progress => { if (current === version) update({ progress }); } });
        if (current !== version) return;
        update({ rows: result.rows, text: result.text, message: result.rows.length ? `Đã nhận ${result.rows.length} buổi. Kiểm tra từng buổi trước khi lưu.` : 'Chưa nhận ra buổi học. Thử ảnh rõ hơn hoặc thêm dòng để nhập lại.' });
      } catch (error) {
        if (current === version) update({ message: error.message || 'Không đọc được ảnh. Hãy thử lại.' });
      } finally { if (current === version) update({ busy: false }); }
    },
    dispose() {
      version++; controller?.abort();
      if (state.image) urls.revokeObjectURL(state.image);
      state = { open: false, semester: null, rows: [], text: '', image: '', busy: false, progress: 0, message: '' };
      listeners.forEach(fn => fn());
    },
  };
}
