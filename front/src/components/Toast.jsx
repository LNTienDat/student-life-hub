import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useLanguage();
  return (
    <AnimatePresence>
      {toast && (
        <div role="status" aria-live="polite" className="fixed top-6 left-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 z-[120] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex w-full items-center gap-3 px-4 py-2 rounded-2xl shadow-xl border backdrop-blur-md text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 shadow-rose-500/10'
                : toast.type === 'info'
                ? 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-200 shadow-blue-500/10'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 shadow-emerald-500/10'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            )}

            <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] leading-tight">{tr(toast.message)}</span>

            <button
              onClick={onClose}
              aria-label={tr("Đóng thông báo")}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
