export const badgeUuTien = (doUu) => {
  switch (doUu) {
    case 'cao':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
    case 'thap':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
  }
};

export const textUuTien = (doUu) => {
  switch (doUu) {
    case 'cao':
      return 'Cao';
    case 'thap':
      return 'Thấp';
    default:
      return 'Thường';
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
