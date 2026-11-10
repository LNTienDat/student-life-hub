import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import CloseButton from './CloseButton';
import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

export default function ModalDialog({ open, onClose, title, children, busy = false, wide = false, closeLabel = 'Đóng' }) {
  useLanguage();
  const dialog = useRef(null);
  const state = useRef({ onClose, busy });
  const titleId = useId();
  useEffect(() => { state.current = { onClose, busy }; }, [onClose, busy]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    const focusable = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
    (focusable().find(node=>!node.hasAttribute('data-dialog-close')) || focusable()[0] || element).focus();
    function keydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); if (!state.current.busy) state.current.onClose(); }
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); element.focus(); return; }
      if (event.shiftKey && (document.activeElement === nodes[0] || !element.contains(document.activeElement))) { event.preventDefault(); nodes.at(-1).focus(); }
      else if (!event.shiftKey && (document.activeElement === nodes.at(-1) || !element.contains(document.activeElement))) { event.preventDefault(); nodes[0].focus(); }
    }
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [open]);
  if (!open) return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={'max-h-[90dvh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800 '+(wide?'max-w-2xl':'max-w-lg')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="min-w-0 break-words pt-2 text-lg font-bold text-slate-900 dark:text-white">{tr(title)}</h2>
        <CloseButton data-dialog-close onClick={()=>{if(!busy)onClose();}} disabled={busy} label={closeLabel} className="-mr-2 -mt-1"/>
      </div>
      {children}
    </section>
  </div>, document.body);
}
