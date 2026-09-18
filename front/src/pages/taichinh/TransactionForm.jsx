import { DANH_MUC_CHI, DANH_MUC_THU, TEN_DANH_MUC } from '../../constants';

function TransactionForm({
  hienFormGD,
  loai,
  danhMuc,
  soTien,
  moTa,
  ngayGiaoDich,
  onLoaiChange,
  onDanhMucChange,
  onSoTienChange,
  onMoTaChange,
  onNgayGiaoDichChange,
  onSubmit,
}) {
  if (!hienFormGD) return null;

  return (
    <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/30">
      <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-4">Thêm giao dịch mới</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="finance-type" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Loại
            </label>
            <select
              id="finance-type"
              value={loai}
              onChange={(e) => onLoaiChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="chi">Chi tiêu</option>
              <option value="thu">Thu nhập</option>
            </select>
          </div>
          <div>
            <label htmlFor="finance-category" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Danh mục
            </label>
            <select
              id="finance-category"
              value={danhMuc}
              onChange={(e) => onDanhMucChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              {(loai === 'thu' ? DANH_MUC_THU : DANH_MUC_CHI).map((dm) => (
                <option key={dm} value={dm}>
                  {TEN_DANH_MUC[dm]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="finance-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Số tiền
            </label>
            <input
              id="finance-amount"
              type="number"
              value={soTien}
              onChange={(e) => onSoTienChange(e.target.value)}
              placeholder="Ví dụ: 50000"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="finance-desc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Mô tả (Không bắt buộc)
          </label>
          <input
            id="finance-desc"
            type="text"
            value={moTa}
            onChange={(e) => onMoTaChange(e.target.value)}
            placeholder="Mua sách, tiền điện..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
          />
        </div>
        <div>
          <label htmlFor="finance-date" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Ngày giao dịch (Tùy chọn)
          </label>
          <input
            id="finance-date"
            type="date"
            value={ngayGiaoDich}
            onChange={(e) => onNgayGiaoDichChange(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />
          <p className="text-xs text-slate-400 mt-1">Để trống = lấy ngày hôm nay</p>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Lưu giao dịch
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;
