export function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getTodayClasses(classes, now) {
  const weekday = now.getDay() === 0 ? 8 : now.getDay() + 1;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  return classes.filter((item) => Number(item.thu) === weekday)
    .sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau))
    .map((item) => ({
      ...item,
      status: minutes >= toMinutes(item.gioKetThuc) ? 'done'
        : minutes >= toMinutes(item.gioBatDau) ? 'ongoing' : 'upcoming',
    }));
}

export function getUrgentDeadlines(deadlines, now) {
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const pending = deadlines.filter((item) => item.trangThai !== 'hoan_thanh'
    && Number.isFinite(new Date(item.hanChot).getTime()));
  const overdue = pending.filter((item) => new Date(item.hanChot) < now);
  const dueToday = pending.filter((item) => new Date(item.hanChot) >= now
    && localDayKey(new Date(item.hanChot)) === localDayKey(now));
  const upcoming = pending.filter((item) => new Date(item.hanChot) >= now
    && new Date(item.hanChot) <= nextWeek);
  return {
    overdue, dueToday,
    items: [...overdue, ...upcoming].sort((a, b) => new Date(a.hanChot) - new Date(b.hanChot)),
  };
}

export function getDailyBudget(budgets, now) {
  if (!budgets.length) return null;
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  // An overspent category must not silently reduce another category's allowance.
  const remaining = budgets.reduce((sum, item) => sum + Math.max(0, item.soTienToiDa - item.daChi), 0);
  return { remaining, daysLeft, perDay: Math.floor(remaining / daysLeft),
    exceeded: budgets.filter((item) => item.daChi > item.soTienToiDa).length };
}
