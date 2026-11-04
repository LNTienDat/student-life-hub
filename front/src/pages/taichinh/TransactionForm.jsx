import MoneyInput from '../../components/MoneyInput';
import CategorySelect from '../../components/CategorySelect';


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
  onCancel,
  dangLuu = false,
  editing = false,
  error = '',
}) {
  if (!hienFormGD) return null;

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800">
      <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-4">{editing ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={dangLuu} className="space-y-4">
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
            <CategorySelect allowArchived={editing} id="finance-category" loai={loai} value={danhMuc} onChange={onDanhMucChange} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label htmlFor="finance-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Số tiền (đồng)
            </label>
            <MoneyInput
              id="finance-amount"
              value={soTien}
              onValueChange={onSoTienChange}
              placeholder="Ví dụ: 50 000"
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
            maxLength={1000}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
          />
        </div>
        <div>
          <label htmlFor="finance-date" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Ngày giao dịch
          </label>
          <input
            id="finance-date"
            type="date"
            value={ngayGiaoDich}
            onChange={(e) => onNgayGiaoDichChange(e.target.value)}
            min="1000-01-01"
            max="9999-12-31"
            required
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />

        </div>
        {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Hủy</button>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            {dangLuu ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Lưu'}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}

export default TransactionForm;
