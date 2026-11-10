import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { useRef, useState } from 'react';
import { Camera, Check, ImagePlus, RotateCcw } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { AVATAR_PRESETS } from '../../utils/avatarPresets';
import ModalDialog from '../../components/ModalDialog';
import { prepareAvatar } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProfilePreferences from './ProfilePreferences';

export default function ProfileIdentity() {
  useLanguage();
  const { user, capNhatUser } = useAuth();
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef(null), lock = useRef(false);
  function openEditor() {
    setDraft(user?.avatar || '');
    setError('');
    setSaved(false);
    setOpen(true);
  }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { setDraft(await prepareAvatar(file)); }
    catch (error) { setError(error.message || 'Không đọc được ảnh. Hãy chọn ảnh khác.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api.put('/auth/ho-so', { avatar: draft });
      capNhatUser(result.data.user); setOpen(false); setSaved(true);
    } catch (error) { setError(error.response?.data?.message || 'Chưa lưu được ảnh đại diện.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <div className="grid items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
      <section aria-label={tr('Ảnh đại diện')} className="flex min-w-0 items-center gap-4">
        <button type="button" aria-label={tr('Đổi ảnh đại diện')} onClick={openEditor} className="group relative shrink-0 rounded-full focus-visible:ring-4 focus-visible:ring-ink-300">
          <Avatar value={user?.avatar} name={user?.ten} size="h-16 w-16 sm:h-20 sm:w-20" className="text-2xl ring-4 ring-slate-50 dark:ring-slate-700" />
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-ink-600 text-white group-hover:bg-ink-700"><Camera aria-hidden="true" className="h-4 w-4" /></span>
        </button>
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold text-slate-900 dark:text-white">{user?.ten}</h2>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-300">{user?.email}</p>
          <button type="button" onClick={openEditor} className="min-h-11 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-200">{tr('Đổi ảnh đại diện')}</button>
          {saved && <p role="status" className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300"><Check className="h-4 w-4" />{tr('Đã lưu ảnh đại diện.')}</p>}
        </div>
      </section>
      <section aria-label={tr('Tùy chọn ứng dụng')} className="border-t border-slate-200 pt-3 dark:border-slate-700 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div className="flex flex-wrap items-center gap-2"><ProfilePreferences /></div>
      </section>
    </div>
    <ModalDialog open={open} onClose={() => setOpen(false)} busy={busy} title={tr("Ảnh đại diện")}>
      <div className="flex justify-center py-2"><Avatar value={draft} name={user?.ten} size="h-24 w-24" className="text-3xl" /></div>
      <p className="my-4 text-center text-sm text-slate-500 dark:text-slate-300">{tr("Chọn ảnh có sẵn hoặc tải ảnh của bạn.")}</p>
      <div role="group" aria-label={tr("Ảnh có sẵn")} className="grid grid-cols-6 gap-2">
        {AVATAR_PRESETS.map(item => <button key={item.id} type="button" aria-label={tr(item.name)} aria-pressed={draft === `preset:${item.id}`} disabled={busy} onClick={() => setDraft(`preset:${item.id}`)} className={`flex min-h-12 items-center justify-center rounded-xl p-1 ${draft === `preset:${item.id}` ? 'ring-2 ring-ink-500 bg-ink-50 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}><Avatar value={`preset:${item.id}`} size="h-10 w-10" /></button>)}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium dark:border-slate-600 dark:text-slate-100"><ImagePlus className="h-4 w-4" />{tr("Tải ảnh lên")}</button>
        <button type="button" disabled={busy || !draft} onClick={() => setDraft('')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium disabled:opacity-40 dark:border-slate-600 dark:text-slate-100"><RotateCcw className="h-4 w-4" />{tr("Dùng chữ cái")}</button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={tr("Tải ảnh đại diện")} className="sr-only" onChange={upload} disabled={busy} />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">{tr("JPG, PNG, WebP · tối đa 5 MB. Ảnh được cắt vuông và thu nhỏ trước khi lưu.")}</p>
      {error && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-300">{tr(error)}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-slate-200 text-sm font-semibold dark:border-slate-600 dark:text-slate-100">{tr("Hủy")}</button>
        <button type="button" disabled={busy} onClick={save} className="min-h-11 rounded-xl bg-ink-600 text-sm font-semibold text-white disabled:opacity-50">{busy ? tr('Đang xử lý...') : tr('Lưu ảnh')}</button>
      </div>
    </ModalDialog>
  </>;
}
