(function () {
  try {
    var saved = localStorage.getItem('theme');
    var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch { /* Theme initialization is optional. */ }
})();
