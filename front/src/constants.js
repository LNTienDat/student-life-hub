/**
 * constants.js
 * Tập trung các hằng số dùng chung trên toàn bộ Frontend Student Life Hub
 */

// 1. Danh mục Tài chính
export const DANH_MUC_CHI = ['an_uong', 'hoc_phi', 'tro', 'giai_tri', 'di_lai', 'khac'];
export const DANH_MUC_THU = ['luong', 'hoc_bong', 'tro_cap', 'thuong', 'khac'];
export const DANH_MUC = [...DANH_MUC_CHI, ...DANH_MUC_THU.filter((d) => !DANH_MUC_CHI.includes(d))];

export const TEN_DANH_MUC = {
  an_uong: 'Ăn uống',
  hoc_phi: 'Học phí',
  tro: 'Nhà trọ',
  giai_tri: 'Giải trí',
  di_lai: 'Đi lại',
  luong: 'Lương / Làm thêm',
  hoc_bong: 'Học bổng',
  tro_cap: 'Trợ cấp gia đình',
  thuong: 'Thưởng',
  khac: 'Khác',
};

// 2. Bảng màu cho Biểu đồ Recharts
export const MAU_DANH_MUC = [
  '#2E3159', // Ink Navy
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#E11D48', // Rose
  '#8B5CF6', // Purple
  '#64748B', // Slate
  '#10B981', // Emerald
  '#06B6D4', // Cyan
];

// 3. Cấu hình Thời khóa biểu
export const CAC_THU = [
  { thu: 2, ten: 'Thứ 2' },
  { thu: 3, ten: 'Thứ 3' },
  { thu: 4, ten: 'Thứ 4' },
  { thu: 5, ten: 'Thứ 5' },
  { thu: 6, ten: 'Thứ 6' },
  { thu: 7, ten: 'Thứ 7' },
  { thu: 8, ten: 'Chủ nhật' },
];

export const MAU_MON = [
  'bg-ink-100 text-ink-800 dark:bg-ink-950/60 dark:text-ink-200 border-ink-300 dark:border-ink-800',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-800',
  'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 border-teal-300 dark:border-teal-800',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800',
];

// 4. Nhãn & Màu Độ ưu tiên Deadline
export const NHAN_DO_UU_TIEN = {
  thap: 'Thấp',
  binh_thuong: 'Bình thường',
  cao: 'Cao',
};

export const MAU_DO_UU_TIEN = {
  thap: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  binh_thuong: 'bg-ink-100 text-ink-700 dark:bg-ink-900/50 dark:text-ink-300',
  cao: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
};
