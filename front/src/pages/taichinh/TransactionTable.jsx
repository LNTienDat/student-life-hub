import { categoryDisplayName } from '../../utils/categoryDisplayName';
import { t as tr, getLocale } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { Search, X, Filter, TrendingUp, TrendingDown, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceCategories } from '../../context/FinanceCategoryContext';
import { dinhDangTien } from '../../utils/formatters';

function TransactionTable({
  giaoDichs = [],
  dangTaiGD = false,
  timKiem,
  locLoai,
  locDanhMuc,
  trangHienTai,
  soTrang,
  onTimKiemChange,
  onLocLoaiChange,
  onLocDanhMucChange,
  onChonTrang,
  onYeuCauXoa,
  onEdit,
  disabled = false,
  error = '',
  onRetry,
  onResetFilters,
  allTime = false,
  onSearchAllTime,
}) {
  useLanguage();
  const { categories, label } = useFinanceCategories();
  const grouped=new Map();for(const item of categories.filter(item=>!locLoai||item.loai===locLoai).map(item=>({...item,ten:categoryDisplayName(item)}))){const previous=grouped.get(item.ma);grouped.set(item.ma,previous?{...item,ten:[...new Set([previous.ten,item.ten])].join(' / '),daAn:previous.daAn&&item.daAn}:item);}const options=[...grouped.values()];
  return (
    <>
      {/* Bộ lọc */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="min-w-0 flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={timKiem}
              onChange={(e) => onTimKiemChange(e.target.value)}
              placeholder={tr("Tìm kiếm giao dịch...")}
              aria-label={tr("Tìm kiếm giao dịch")}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl min-h-11 pl-10 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            />
            {timKiem&&<button type="button" disabled={disabled} onClick={()=>onTimKiemChange('')} aria-label={tr("Xóa từ khóa tìm kiếm")} className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500"><X className="h-4 w-4"/></button>}
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3 w-full md:w-[380px]">
            <div className="min-w-0">
            <select
              value={locLoai}
              onChange={(e) => onLocLoaiChange(e.target.value)}
              aria-label={tr("Lọc theo loại giao dịch")}
              className="min-h-11 min-w-0 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="">Thu - Chi</option>
              <option value="thu">{tr("Thu nhập")}</option>
              <option value="chi">{tr("Chi tiêu")}</option>
            </select>
            </div>
            <div className="min-w-0">
            <select
              value={locDanhMuc}
              onChange={(e) => onLocDanhMucChange(e.target.value)}
              aria-label={tr("Lọc theo danh mục")}
              className="min-h-11 min-w-0 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="">{tr("Danh mục")}</option>
              {options.map(({ma:dm,daAn,ten}) => (
                <option key={dm} value={dm}>
                  {ten}{daAn ? tr(" (đã xóa khỏi danh sách)") : ""}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>
        {(timKiem||locLoai||locDanhMuc)&&<button type="button" disabled={disabled} onClick={onResetFilters} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-600 dark:text-ink-300"><X className="h-4 w-4"/>{tr("Xóa bộ lọc")}</button>}
      </div>

      {/* Danh sách */}
      <div className="min-h-[160px]">
        {dangTaiGD ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-ink-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div role="alert" className="p-6 text-center text-rose-700 dark:text-rose-300"><p>{tr(error)}</p><button type="button" onClick={onRetry} className="mt-3 rounded-lg border px-4 py-2 font-medium">{tr("Thử lại")}</button></div>
        ) : giaoDichs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{timKiem || locLoai || locDanhMuc ? tr('Không tìm thấy giao dịch phù hợp') : (allTime?tr('Chưa có giao dịch'):tr('Chưa có giao dịch trong tháng đã chọn'))}</h3>
            <p className="text-sm text-slate-500 mt-1">{timKiem || locLoai || locDanhMuc ? tr('Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.') : tr('Chọn “Thêm giao dịch” để ghi khoản thu hoặc chi đầu tiên.')}</p>
            {!allTime&&<button type="button" onClick={onSearchAllTime} className="mt-3 min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-ink-600 dark:border-slate-600 dark:text-ink-300">{tr("Tìm trong mọi thời gian")}</button>}
          </div>
        ) : (
          <div role="list" aria-label={tr("Danh sách giao dịch")} className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {giaoDichs.map((gd) => (
              <div
                key={gd.id}
                role="listitem"
                data-transaction-id={gd.id}
                className="p-4 md:p-6 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                      gd.loai === 'thu'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}
                  >
                    {gd.loai === 'thu' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900 dark:text-white">
                      {label(gd.danhMuc,gd.loai)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{new Date(gd.ngayGiaoDich).toLocaleDateString(getLocale(), { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
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
                  <div className="flex gap-1">
                  <button type="button" disabled={disabled} onClick={event => onEdit(gd, event.currentTarget)} aria-label={tr("Sửa giao dịch {0} số tiền {1}", label(gd.danhMuc,gd.loai), dinhDangTien(gd.soTien))} className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-ink-600 hover:bg-ink-50 disabled:opacity-40 dark:hover:bg-slate-700"><Pencil size={16} /></button>
                  <button type="button" disabled={disabled}
                    onClick={() => onYeuCauXoa(gd)}
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title={tr("Xóa giao dịch")}
                    aria-label={tr("Xóa giao dịch {0} số tiền {1}", label(gd.danhMuc,gd.loai), dinhDangTien(
                      gd.soTien
                    ))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </div>
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
              disabled={disabled || dangTaiGD || trangHienTai <= 1}
              aria-label={tr("Trang trước")}
              className="min-h-11 min-w-11 flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onChonTrang(trangHienTai + 1)}
              disabled={disabled || dangTaiGD || trangHienTai >= soTrang}
              aria-label="Trang sau"
              className="min-h-11 min-w-11 flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
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
