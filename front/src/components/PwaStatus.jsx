import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import ThemeToggle from './ThemeToggle';
import { useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import pwaClient from '../pwa/runtime';
import { useAuth } from '../context/AuthContext';
import InstallButton from './InstallButton';
import ModalDialog from './ModalDialog';

export default function PwaStatus() {
  useLanguage();
  const { online, installed, canInstall, updateReady } = useSyncExternalStore(pwaClient.subscribe, pwaClient.getSnapshot);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const authPage = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau'].includes(pathname);
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const install = useCallback(async () => {
    if (lock.current || installed || !online) return;
    setMessage('');
    if (!canInstall) { setHelp(true); return; }
    lock.current = true;
    try {
      const result = await pwaClient.install();
      if (result !== 'accepted') {
        setMessage('Bạn vẫn có thể cài LifeHub từ menu trình duyệt.'); setHelp(true);
      }
    } catch { setMessage('Chưa cài được. Hãy thử từ menu trình duyệt.'); setHelp(true); }
    finally { lock.current = false; }
  }, [canInstall, installed, online]);
  useEffect(() => {
    window.addEventListener('slh:install-request', install);
    return () => window.removeEventListener('slh:install-request', install);
  }, [install]);
  return <div className="text-sm">
    {!online && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"><div className="mx-auto flex max-w-7xl items-start gap-2"><WifiOff className="mt-0.5 h-4 w-4 shrink-0"/><p>{tr("Đang mất kết nối. Điểm, deadline và chi tiêu cần mạng để cập nhật; các thao tác chưa lưu sẽ không tự gửi lại.")}</p></div></div>}
    {updateReady && <div className="border-b border-ink-200 bg-ink-50 px-4 py-3 text-ink-700 dark:text-ink-200"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><p role="status">{tr("Có phiên bản LifeHub mới. Lưu việc đang nhập trước khi tải lại.")}</p><button type="button" onClick={() => pwaClient.applyUpdate()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink-600 px-3 text-white"><RefreshCw className="h-4 w-4"/>{tr("Cập nhật và tải lại")}</button></div></div>}
    {!user && <div className="fixed right-4 top-4 z-40 flex gap-2">{authPage && <ThemeToggle />}{!installed && <InstallButton className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-600 shadow-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-ink-200"/>}</div>}
    <ModalDialog open={help && !installed} onClose={() => setHelp(false)} title={tr("Cài LifeHub")}>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {message && <p role="status">{tr(message)}</p>}
        <p><strong>Android:</strong>{tr(" mở bằng Chrome, chọn menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính.")}</p>
        <p><strong>iPhone:</strong>{tr(" mở bằng Safari, chọn Chia sẻ → Thêm vào Màn hình chính.")}</p>
        <p><strong>{tr("Máy tính:")}</strong>{tr(" chọn biểu tượng cài đặt ở thanh địa chỉ hoặc menu trình duyệt.")}</p>
        <p className="text-xs">{tr("Trên điện thoại, dùng địa chỉ HTTPS của LifeHub. Nếu trình duyệt chưa hỗ trợ cài đặt, bạn vẫn sử dụng web bình thường.")}</p>
      </div>
    </ModalDialog>
  </div>;
}
