export function completionCountdown(item, now = Date.now()) {
  if (!item.hoanThanhLuc) return '';
  const remaining = Math.max(0, new Date(item.hoanThanhLuc).getTime() + 86400000 - now);
  if (!remaining) return 'Đang chuyển vào Đã xóa…';
  const minutes = Math.ceil(remaining / 60000);
  return `Xóa sau ${Math.floor(minutes / 60)}h ${minutes % 60}p`;
}
