import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md text-sm font-medium ${
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

            <span className="leading-tight">{toast.message}</span>

            <button
              onClick={onClose}
              className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
