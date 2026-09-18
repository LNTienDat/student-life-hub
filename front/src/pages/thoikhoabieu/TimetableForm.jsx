import { CAC_THU } from './timetableUtils';

function TimetableForm({
  hienForm,
  dangSuaId,
  tenMon,
  thu,
  gioBatDau,
  gioKetThuc,
  phongHoc,
  giangVien,
  onTenMonChange,
  onThuChange,
  onGioBatDauChange,
  onGioKetThucChange,
  onPhongHocChange,
  onGiangVienChange,
  onSubmit,
  onCancel,
}) {
  if (!hienForm) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-500/40 relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-ink-400" />
      <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-5 ml-2">
        {dangSuaId ? 'Cập nhật buổi học' : 'Thêm buổi học mới'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 ml-2">
        <div className="md:col-span-2">
          <label htmlFor="tkb-ten-mon" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Tên môn học
          </label>
          <input
            id="tkb-ten-mon"
            value={tenMon}
            onChange={(e) => onTenMonChange(e.target.value)}
            placeholder="VD: Toán cao cấp A1"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
            required
          />
        </div>

        <div>
          <label htmlFor="tkb-thu" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Thứ
          </label>
          <select
            id="tkb-thu"
            value={thu}
            onChange={(e) => onThuChange(parseInt(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          >
            {CAC_THU.map((t) => (
              <option key={t.gia} value={t.gia}>
                {t.ten}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tkb-gio-bat-dau" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Giờ bắt đầu
            </label>
            <input
              id="tkb-gio-bat-dau"
              type="time"
              value={gioBatDau}
              onChange={(e) => onGioBatDauChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
              required
            />
          </div>
          <div>
            <label htmlFor="tkb-gio-ket-thuc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Giờ kết thúc
            </label>
            <input
              id="tkb-gio-ket-thuc"
              type="time"
              value={gioKetThuc}
              onChange={(e) => onGioKetThucChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="tkb-phong-hoc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Phòng học (Tùy chọn)
          </label>
          <input
            id="tkb-phong-hoc"
            value={phongHoc}
            onChange={(e) => onPhongHocChange(e.target.value)}
            placeholder="VD: D5-201"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="tkb-giang-vien" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Giảng viên (Tùy chọn)
          </label>
          <input
            id="tkb-giang-vien"
            value={giangVien}
            onChange={(e) => onGiangVienChange(e.target.value)}
            placeholder="VD: TS. Nguyễn Văn A"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />
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
          {dangSuaId ? 'Cập nhật' : 'Lưu buổi học'}
        </button>
      </div>
    </form>
  );
}

export default TimetableForm;
