export const badgeUuTien = (doUu) => {
  switch (doUu) {
    case 'cao':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
    case 'thap':
      return 'bg-slate-50 text-emerald-700 dark:bg-slate-700/50 dark:text-emerald-300 border border-slate-200 dark:border-slate-600';
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
  }
};

export const textUuTien = (doUu) => {
  switch (doUu) {
    case 'cao':
      return 'Khẩn cấp';
    case 'thap':
      return 'Thấp';
    default:
      return 'Bình thường';
  }
};

export const taoLich = (thang) => {
  const nam = thang.getFullYear();
  const th = thang.getMonth();
  const ngayDauThang = new Date(nam, th, 1);
  const thuNgayDau = ngayDauThang.getDay() === 0 ? 6 : ngayDauThang.getDay() - 1; // T2 là 0
  const lich = [];
  let ngayHienTai = new Date(nam, th, 1 - thuNgayDau);

  for (let i = 0; i < 42; i++) {
    lich.push(new Date(ngayHienTai));
    ngayHienTai.setDate(ngayHienTai.getDate() + 1);
  }
  return lich;
};

export const khoaNgay = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export const DEADLINE_PRIORITIES = [
  { value: 'cao', label: 'Khẩn cấp' },
  { value: 'binh_thuong', label: 'Bình thường' },
  { value: 'thap', label: 'Thấp' },
];

const priorityRank = new Map(DEADLINE_PRIORITIES.map((item, index) => [item.value, index]));
const priorityOf = item => priorityRank.has(item.doUuTien) ? item.doUuTien : 'binh_thuong';
const dueTime = item => {
  const value = new Date(item.hanChot).getTime();
  return item.hanChot && Number.isFinite(value) ? value : Infinity;
};

// Never reorder the response array: other views can still use the original data.
export function selectDeadlines(items, priority = 'all') {
  const selected = priorityRank.has(priority) ? items.filter(item => priorityOf(item) === priority) : [...items];
  return selected.sort((a, b) => {
    const completed = Number(a.trangThai === 'hoan_thanh') - Number(b.trangThai === 'hoan_thanh');
    if (completed) return completed;
    const importance = priorityRank.get(priorityOf(a)) - priorityRank.get(priorityOf(b));
    if (importance) return importance;
    const aTime = dueTime(a), bTime = dueTime(b);
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''), 'en', { numeric: true });
  });
}
