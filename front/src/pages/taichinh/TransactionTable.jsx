import { Search, Filter, TrendingUp, TrendingDown, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DANH_MUC, TEN_DANH_MUC } from '../../constants';
import { dinhDangTien, dinhDangNgay } from '../../utils/formatters';

function TransactionTable({
  giaoDichs = [],
  dangTaiGD = false,
  timKiem,
  locLoai,
  locDanhMuc,
  chiThangNay,
  trangHienTai,
  soTrang,
  onTimKiemChange,
  onLocLoaiChange,
  onLocDanhMucChange,
  onChiThangNayChange,
  onChonTrang,
  onYeuCauXoa,
}) {
  return (
    <>
      {/* Bộ lọc */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={timKiem}
              onChange={(e) => onTimKiemChange(e.target.value)}
              placeholder="Tìm kiếm giao dịch..."
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={locLoai}
              onChange={(e) => onLocLoaiChange(e.target.value)}
              className="w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="">Tất cả loại</option>
              <option value="thu">Thu nhập</option>
              <option value="chi">Chi tiêu</option>
            </select>
            <select
              value={locDanhMuc}
              onChange={(e) => onLocDanhMucChange(e.target.value)}
              className="w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="">Tất cả danh mục</option>
              {DANH_MUC.map((dm) => (
                <option key={dm} value={dm}>
                  {TEN_DANH_MUC[dm]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full md:w-auto">
            <input
              type="checkbox"
              checked={chiThangNay}
              onChange={(e) => onChiThangNayChange(e.target.checked)}
              className="rounded border-slate-300 text-ink-600 focus:ring-ink-500"
            />
            Chỉ tháng này
          </label>
        </div>
      </div>

      {/* Danh sách */}
      <div className="min-h-[300px]">
        {dangTaiGD ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-ink-500 rounded-full animate-spin"></div>
          </div>
        ) : giaoDichs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy giao dịch</h3>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {giaoDichs.map((gd) => (
              <div
                key={gd.id}
                className="p-4 md:p-6 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      gd.loai === 'thu'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}
                  >
                    {gd.loai === 'thu' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {TEN_DANH_MUC[gd.danhMuc] || gd.danhMuc}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{dinhDangNgay(gd.ngayGiaoDich)}</span>
                      {gd.moTa && (
                        <>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="truncate max-w-[150px] md:max-w-xs">{gd.moTa}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`font-display font-bold ${
                      gd.loai === 'thu'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {gd.loai === 'thu' ? '+' : '-'}
                    {dinhDangTien(gd.soTien)}
                  </span>
                  <button
                    onClick={() => onYeuCauXoa(gd)}
                    className="text-slate-400 hover:text-rose-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    title="Xóa giao dịch"
                    aria-label={`Xóa giao dịch ${TEN_DANH_MUC[gd.danhMuc] || gd.danhMuc} số tiền ${dinhDangTien(
                      gd.soTien
                    )}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phân trang */}
      {soTrang > 1 && (
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Trang <span className="font-semibold text-slate-900 dark:text-white">{trangHienTai}</span> / {soTrang}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onChonTrang(trangHienTai - 1)}
              disabled={trangHienTai <= 1}
              aria-label="Trang trước"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onChonTrang(trangHienTai + 1)}
              disabled={trangHienTai >= soTrang}
              aria-label="Trang sau"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TransactionTable;
