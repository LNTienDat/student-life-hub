import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  subTitle = '',
  itemInfo = null, // Có thể là string hoặc { label, value, extra }
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmText = 'Xóa',
  cancelText = 'Hủy bỏ',
  type = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) {
  // Đóng khi bấm phím ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop mờ nền */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Khung Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 p-6 overflow-hidden z-10"
          >
            {/* Nút đóng góc phải */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Phần tiêu đề & Icon trực quan */}
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                  type === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60'
                    : type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                }`}
              >
                {type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 pr-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {title}
                </h3>
                {subTitle && (
                  <p className="text-xs font-semibold text-ink-600 dark:text-ink-400 mt-0.5">
                    {subTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Hộp xem trước đối tượng sắp xóa (Trực quan, dễ hình dung) */}
            {itemInfo && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-sm">
                {typeof itemInfo === 'string' ? (
                  <p className="font-medium text-slate-700 dark:text-slate-300">{itemInfo}</p>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {itemInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs font-medium">
                      {itemInfo.value && (
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                          {itemInfo.value}
                        </span>
                      )}
                      {itemInfo.extra && (
                        <span className="text-slate-500 dark:text-slate-400">
                          ({itemInfo.extra})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nội dung thông báo giải thích */}
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>

            {/* Các nút hành động */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 ${
                  type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/25'
                    : type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/25'
                    : 'bg-ink-600 hover:bg-ink-700 active:bg-ink-800 shadow-ink-600/25'
                }`}
              >
                {type === 'danger' && <Trash2 className="w-4 h-4" />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
