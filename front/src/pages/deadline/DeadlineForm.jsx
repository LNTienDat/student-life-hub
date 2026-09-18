function DeadlineForm({
  hienFormThem,
  dangSuaId,
  tieuDe,
  moTa,
  hanChot,
  doUuTien,
  idMonHoc,
  danhSachMonHoc = [],
  onTieuDeChange,
  onMoTaChange,
  onHanChotChange,
  onDoUuTienChange,
  onIdMonHocChange,
  onSubmit,
  onCancel,
}) {
  if (!hienFormThem) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-500/40 relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-ink-400" />
      <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-5 ml-2">
        {dangSuaId ? 'Cập nhật Deadline' : 'Tạo Deadline mới'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ml-2">
        <div className="md:col-span-2">
          <label htmlFor="deadline-title" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Tiêu đề công việc
          </label>
          <input
            id="deadline-title"
            type="text"
            value={tieuDe}
            onChange={(e) => onTieuDeChange(e.target.value)}
            placeholder="Ví dụ: Nộp bài tập lớn môn CSDL"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
            required
          />
        </div>

        <div>
          <label htmlFor="deadline-due" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Hạn chót
          </label>
          <input
            id="deadline-due"
            type="datetime-local"
            value={hanChot}
            onChange={(e) => onHanChotChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
            required
          />
        </div>

        <div>
          <label htmlFor="deadline-subject" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Môn học (Tùy chọn)
          </label>
          <select
            id="deadline-subject"
            value={idMonHoc}
            onChange={(e) => onIdMonHocChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          >
            <option value="">-- Không gắn môn học --</option>
            {danhSachMonHoc.map((m) => (
              <option key={m.id} value={m.id}>
                {m.ten} ({m.hocKy})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="deadline-priority" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Độ ưu tiên
          </label>
          <select
            id="deadline-priority"
            value={doUuTien}
            onChange={(e) => onDoUuTienChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          >
            <option value="thap">Thấp (Có thể làm sau)</option>
            <option value="binh_thuong">Bình thường</option>
            <option value="cao">Cao (Khẩn cấp)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="deadline-desc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Mô tả thêm (Tùy chọn)
          </label>
          <textarea
            id="deadline-desc"
            value={moTa}
            onChange={(e) => onMoTaChange(e.target.value)}
            placeholder="Ghi chú thêm chi tiết, link tài liệu..."
            rows="3"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 ml-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
        >
          {dangSuaId ? 'Cập nhật' : 'Lưu công việc'}
        </button>
      </div>
    </form>
  );
}

export default DeadlineForm;
