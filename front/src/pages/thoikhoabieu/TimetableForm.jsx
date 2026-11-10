import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { CAC_THU } from './timetableUtils';

function TimetableForm({
  hocKy,
  onHocKyChange,
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
  saving = false,
  onCancel,
}) {
  useLanguage();
  if (!hienForm) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-500/40 relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-ink-400" />
      <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-5 ml-2">
        {dangSuaId ? tr('Cập nhật lịch lặp hằng tuần') : tr('Thêm lịch lặp hằng tuần')}
      </h3>
      <p className="mb-4 ml-2 text-sm text-slate-500 dark:text-slate-400">{tr("Lưu ở đây cập nhật lịch lặp cho các tuần trong học kỳ. Icon lịch trên từng môn chỉ dùng khi nghỉ hoặc đổi riêng một ngày.")}</p>

      <label className="mb-4 ml-2 block text-sm text-slate-600">{tr("Học kỳ (để trống nếu dùng chung)")}<input value={hocKy} onChange={(e) => onHocKyChange(e.target.value)} maxLength={100} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 ml-2">
        <div className="md:col-span-2">
          <label htmlFor="tkb-ten-mon" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Tên môn học")}</label>
          <input
            id="tkb-ten-mon"
            maxLength={100}
            value={tenMon}
            onChange={(e) => onTenMonChange(e.target.value)}
            placeholder={tr("VD: Toán cao cấp A1")}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
            required
          />
        </div>

        <div>
          <label htmlFor="tkb-thu" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Thứ")}</label>
          <select
            id="tkb-thu"
            value={thu}
            onChange={(e) => onThuChange(parseInt(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          >
            {CAC_THU.map((t) => (
              <option key={t.gia} value={t.gia}>
                {tr(t.ten)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tkb-gio-bat-dau" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Giờ bắt đầu")}</label>
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
            <label htmlFor="tkb-gio-ket-thuc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Giờ kết thúc")}</label>
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
          <label htmlFor="tkb-phong-hoc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Phòng học (Tùy chọn)")}</label>
          <input
            id="tkb-phong-hoc"
            maxLength={50}
            value={phongHoc}
            onChange={(e) => onPhongHocChange(e.target.value)}
            placeholder="VD: D5-201"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="tkb-giang-vien" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Giảng viên (Tùy chọn)")}</label>
          <input
            id="tkb-giang-vien"
            maxLength={100}
            value={giangVien}
            onChange={(e) => onGiangVienChange(e.target.value)}
            placeholder={tr("VD: TS. Nguyễn Văn A")}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 ml-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >{tr("Hủy bỏ")}</button>
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
        >
          {dangSuaId ? tr('Cập nhật') : tr('Lưu buổi học')}
        </button>
      </div>
    </form>
  );
}

export default TimetableForm;
