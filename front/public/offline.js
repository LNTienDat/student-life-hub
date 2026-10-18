document.getElementById('retry').addEventListener('click', function () {
  if (location.pathname === '/offline.html') location.replace('/dashboard');
  else location.reload();
});
window.addEventListener('online', function () {
  document.getElementById('connection').textContent = 'Thiết bị đã có mạng. Nhấn Thử kết nối lại để tiếp tục.';
});
