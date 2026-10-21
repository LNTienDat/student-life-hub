import ModalDialog from '../../components/ModalDialog';
import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Globe, Lock } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useToast } from '../../context/ToastContext';

function TimetableShareModal({ isOpen, onClose }) {
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [daCopy, setDaCopy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { hienToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    async function taiTrangThai() {
      try {
        const res = await timetableService.layTrangThaiChiaSe();
        if (!active) return;
        setShareEnabled(res.data.shareEnabled);
        setShareToken(res.data.shareToken);
      } catch (error) {
        if (active) setLoadError(error.response?.data?.message || 'Chưa tải được trạng thái chia sẻ. Vui lòng đóng và mở lại.');
      } finally { if (active) setLoading(false); }
    }
    taiTrangThai();
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const publicUrl = shareToken
    ? `${window.location.origin}/chia-se-tkb/${shareToken}`
    : '';

  async function xuLyBatChiaSe() {
    if (dangXuLy || loading || loadError) return;
    setDangXuLy(true);
    try {
      const res = await timetableService.batChiaSe();
      setShareEnabled(true);
      setShareToken(res.data.shareToken);
      hienToast('success', 'Đã bật chia sẻ thời khóa biểu công khai!');
    } catch {
      hienToast('error', 'Có lỗi khi bật chia sẻ');
    } finally {
      setDangXuLy(false);
    }
  }

  async function xuLyTatChiaSe() {
    if (dangXuLy || loading || loadError) return;
    setDangXuLy(true);
    try {
      await timetableService.tatChiaSe();
      setShareEnabled(false);
      hienToast('info', 'Đã tắt chia sẻ thời khóa biểu.');
    } catch {
      hienToast('error', 'Có lỗi khi tắt chia sẻ');
    } finally {
      setDangXuLy(false);
    }
  }

  async function saoChepLink() {
    if (!publicUrl) return;
    try { await navigator.clipboard.writeText(publicUrl); } catch { hienToast('error', 'Chưa sao chép được. Bạn có thể chọn liên kết để sao chép thủ công.'); return; }
    setDaCopy(true);
    hienToast('success', 'Đã sao chép liên kết vào bộ nhớ tạm!');
    setTimeout(() => setDaCopy(false), 2000);
  }

  return (
    <ModalDialog open={isOpen} onClose={onClose} title="Chia sẻ thời khóa biểu" busy={dangXuLy}>
        {loading && <p role="status" className="mb-3 text-sm text-slate-500">Đang tải trạng thái chia sẻ…</p>}
        {loadError && <p role="alert" className="mb-3 text-sm text-rose-600">{loadError}</p>}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-ink-50 dark:bg-ink-950/60 text-ink-600 dark:text-ink-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chia sẻ thời khóa biểu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cho phép bạn bè cùng lớp xem lịch học của bạn
            </p>
          </div>
        </div>

        <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shareEnabled ? (
                <Globe className="w-4 h-4 text-emerald-500" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {shareEnabled ? 'Đang bật chia sẻ công khai' : 'Đang ở chế độ riêng tư'}
              </span>
            </div>

            <button
              onClick={shareEnabled ? xuLyTatChiaSe : xuLyBatChiaSe}
              disabled={dangXuLy || loading || !!loadError}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                shareEnabled
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-ink-600 hover:bg-ink-700 text-white'
              }`}
            >
              {dangXuLy ? 'Đang lưu...' : shareEnabled ? 'Tắt chia sẻ' : 'Bật chia sẻ'}
            </button>
          </div>

          {shareEnabled && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Liên kết chia sẻ (Chỉ xem):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 truncate select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saoChepLink}
                  className="p-2 rounded-lg bg-ink-600 hover:bg-ink-700 text-white flex-shrink-0 transition-colors"
                  title="Sao chép"
                >
                  {daCopy ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Ai có liên kết này đều có thể xem thời khóa biểu tuần của bạn mà không cần đăng nhập.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
    </ModalDialog>
  );
}

export default TimetableShareModal;
