export const CAC_THU = [
  { gia: 2, ten: 'Thứ 2', tat: 'T2' },
  { gia: 3, ten: 'Thứ 3', tat: 'T3' },
  { gia: 4, ten: 'Thứ 4', tat: 'T4' },
  { gia: 5, ten: 'Thứ 5', tat: 'T5' },
  { gia: 6, ten: 'Thứ 6', tat: 'T6' },
  { gia: 7, ten: 'Thứ 7', tat: 'T7' },
  { gia: 8, ten: 'Chủ nhật', tat: 'CN' },
];

export const MAU_MON = [
  'bg-ink-50/80 border-ink-200 text-ink-800 dark:bg-ink-900/30 dark:border-ink-800 dark:text-ink-300',
  'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  'bg-violet-50/80 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300',
  'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300',
  'bg-cyan-50/80 border-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300',
  'bg-fuchsia-50/80 border-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-300',
];

export function mauChoMon(tenMon = '') {
  let hash = 0;
  for (let i = 0; i < tenMon.length; i++) {
    hash = tenMon.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MAU_MON[Math.abs(hash) % MAU_MON.length];
}

export function gioSangPhut(gio) {
  if (!gio) return 0;
  const [g, p] = gio.split(':').map(Number);
  return g * 60 + p;
}
