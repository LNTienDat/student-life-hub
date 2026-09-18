function SubjectForm({
  hienFormThem,
  dangSuaId,
  tenMon,
  tinChi,
  hocKy,
  onTenMonChange,
  onTinChiChange,
  onHocKyChange,
  onSubmit,
}) {
  if (!hienFormThem) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-500/40 flex flex-col md:flex-row gap-4 items-end relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-ink-400" />
      <div className="flex-1 w-full pl-2">
        <label htmlFor="subject-name" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Tên môn học
        </label>
        <input
          id="subject-name"
          type="text"
          value={tenMon}
          onChange={(e) => onTenMonChange(e.target.value)}
          placeholder="VD: Toán cao cấp"
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          required
        />
      </div>
      <div className="w-full md:w-28">
        <label htmlFor="subject-credits" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Tín chỉ
        </label>
        <input
          id="subject-credits"
          type="number"
          value={tinChi}
          onChange={(e) => onTinChiChange(e.target.value)}
          min="1"
          max="20"
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          required
        />
      </div>
      <div className="w-full md:w-48">
        <label htmlFor="subject-semester" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Học kỳ
        </label>
        <input
          id="subject-semester"
          type="text"
          value={hocKy}
          onChange={(e) => onHocKyChange(e.target.value)}
          placeholder="VD: HK1 2024"
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full md:w-auto bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        {dangSuaId ? 'Cập nhật' : 'Lưu môn học'}
      </button>
    </form>
  );
}

export default SubjectForm;
