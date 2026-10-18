import { useState, useSyncExternalStore } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import pwaClient from '../pwa/runtime';

export default function PwaStatus() {
  const { online, installed, canInstall, updateReady } = useSyncExternalStore(pwaClient.subscribe, pwaClient.getSnapshot);
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function install() {
    if (!canInstall) { setHelp(!help); return; }
    setBusy(true); setMessage('');
    try {
      const result = await pwaClient.install();
      if (result === 'dismissed') setMessage('Bạn có thể cài LifeHub sau từ menu trình duyệt.');
    } catch { setMessage('Chưa cài được. Hãy thử từ menu trình duyệt.'); }
    finally { setBusy(false); }
  }
  return <div className="text-sm">
    {!online && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"><div className="mx-auto flex max-w-7xl items-start gap-2"><WifiOff className="mt-0.5 h-4 w-4 shrink-0"/><p>Đang mất kết nối. Điểm, deadline và chi tiêu cần mạng để cập nhật; các thao tác chưa lưu sẽ không tự gửi lại.</p></div></div>}
    {updateReady && <div className="border-b border-ink-200 bg-ink-50 px-4 py-3 text-ink-700 dark:text-ink-200"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><p role="status">Có phiên bản LifeHub mới. Lưu việc đang nhập trước khi tải lại.</p><button type="button" onClick={() => pwaClient.applyUpdate()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink-600 px-3 text-white"><RefreshCw className="h-4 w-4"/>Cập nhật và tải lại</button></div></div>}
    {!installed && <div className="border-b border-slate-200 bg-white px-4 py-2"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-500">Mở LifeHub từ màn hình chính của bạn</span><button type="button" onClick={install} disabled={busy || !online} aria-expanded={help} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold text-ink-600 disabled:opacity-50"><Download className="h-4 w-4"/>{canInstall ? 'Cài LifeHub' : 'Hướng dẫn cài'}</button></div>
      {help && <div className="mx-auto max-w-7xl py-3 text-slate-600 space-y-2"><div className="flex items-center justify-between gap-3"><strong>Cài trên thiết bị</strong><button type="button" aria-label="Đóng hướng dẫn cài" onClick={() => setHelp(false)} className="p-2"><X className="h-4 w-4"/></button></div><p>Android: mở bằng Chrome, chọn menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính.</p><p>iPhone: mở bằng Safari, chọn Chia sẻ → Thêm vào Màn hình chính.</p><p>Máy tính: tìm biểu tượng cài đặt ở thanh địa chỉ. Nếu chưa có tùy chọn này, bạn vẫn có thể dùng LifeHub ngay trên trình duyệt.</p><p className="text-xs">Cài trên điện thoại cần địa chỉ HTTPS công khai. Địa chỉ localhost chỉ dùng thử trên chính máy đang chạy dự án.</p></div>}
      {message && <p role="status" className="mx-auto max-w-7xl py-2 text-slate-600">{message}</p>}
    </div>}
  </div>;
}
