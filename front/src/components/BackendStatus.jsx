import { useState, useSyncExternalStore } from 'react';
import { LoaderCircle, RefreshCw, ServerOff } from 'lucide-react';
import connection from '../services/backendRuntime';

export default function BackendStatus() {
  const { status } = useSyncExternalStore(connection.subscribe, connection.getSnapshot);
  const [retrying, setRetrying] = useState(false);
  if (!['waking', 'error', 'offline'].includes(status)) return null;
  const waking = status === 'waking' || retrying;
  async function retry() {
    setRetrying(true);
    try { await connection.retry(); } catch { /* Connection status supplies the visible message. */ }
    finally { setRetrying(false); }
  }
  return <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
      <div role="status" aria-live="polite" className="flex items-start gap-2">
        {waking ? <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin" /> : <ServerOff className="mt-0.5 h-5 w-5 shrink-0" />}
        <div><p className="font-semibold">{waking ? 'Đang kết nối máy chủ LifeHub…' : status === 'offline' ? 'Thiết bị đang mất mạng' : 'Chưa kết nối được máy chủ'}</p>
          <p className="mt-1 text-xs leading-relaxed">{waking
            ? 'Lần mở đầu sau một thời gian không dùng có thể mất khoảng một phút. Trang sẽ tiếp tục khi kết nối sẵn sàng.'
            : 'Kiểm tra mạng và thử kết nối lại. Thao tác lưu hoặc xóa không được tự gửi lại; nếu vừa báo lỗi, hãy kiểm tra dữ liệu trước khi thao tác lại.'}</p>
        </div>
      </div>
      <button type="button" onClick={retry} disabled={waking} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-400 px-3 font-semibold disabled:opacity-50"><RefreshCw className="h-4 w-4" />Thử kết nối lại</button>
    </div>
  </div>;
}
