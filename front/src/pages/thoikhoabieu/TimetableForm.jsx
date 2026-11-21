import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import ModalDialog from '../../components/ModalDialog';
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
    <ModalDialog
      open={hienForm}
      onClose={onCancel}
      busy={saving}
      wide
      title={dangSuaId ? 'Cập nhật lịch lặp hằng tuần' : 'Thêm lịch lặp hằng tuần'}
    >
      <form onSubmit={onSubmit}>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {tr("Lưu ở đây cập nhật lịch lặp cho các tuần trong học kỳ. Icon lịch trên từng môn chỉ dùng khi nghỉ hoặc đổi riêng một ngày.")}
        </p>

        <label className="mb-4 block text-sm font-medium text-slate-600 dark:text-slate-400">
          {tr("Học kỳ (để trống nếu dùng chung)")}
          <input
            value={hocKy}
            onChange={(e) => onHocKyChange(e.target.value)}
            maxLength={100}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="tkb-ten-mon" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Tên môn học")}</label>
            <input
              id="tkb-ten-mon"
              maxLength={100}
              value={tenMon}
              onChange={(e) => onTenMonChange(e.target.value)}
              placeholder={tr("VD: Toán cao cấp A1")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="tkb-thu" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Thứ")}</label>
            <select
              id="tkb-thu"
              value={thu}
              onChange={(e) => onThuChange(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            >
              {CAC_THU.map((t) => (
                <option key={t.gia} value={t.gia}>
                  {tr(t.ten)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tkb-gio-bat-dau" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Giờ bắt đầu")}</label>
              <input
                id="tkb-gio-bat-dau"
                type="time"
                value={gioBatDau}
                onChange={(e) => onGioBatDauChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="tkb-gio-ket-thuc" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Giờ kết thúc")}</label>
              <input
                id="tkb-gio-ket-thuc"
                type="time"
                value={gioKetThuc}
                onChange={(e) => onGioKetThucChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="tkb-phong-hoc" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Phòng học (Tùy chọn)")}</label>
            <input
              id="tkb-phong-hoc"
              maxLength={50}
              value={phongHoc}
              onChange={(e) => onPhongHocChange(e.target.value)}
              placeholder="VD: D5-201"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="tkb-giang-vien" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Giảng viên (Tùy chọn)")}</label>
            <input
              id="tkb-giang-vien"
              maxLength={100}
              value={giangVien}
              onChange={(e) => onGiangVienChange(e.target.value)}
              placeholder={tr("VD: TS. Nguyễn Văn A")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="min-h-11 rounded-xl px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >{tr("Hủy bỏ")}</button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="min-h-11 rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {dangSuaId ? tr('Cập nhật') : tr('Lưu buổi học')}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}

export default TimetableForm;
