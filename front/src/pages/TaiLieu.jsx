import { t as tr, getLocale } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, FileText, Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import useDataRevision from '../hooks/useDataRevision';
import ModalDialog from '../components/ModalDialog';
import { useToast } from '../context/ToastContext';

const FIELD = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800';
const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-slate-600';
function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Không đọc được tệp. Hãy chọn lại.'));
    reader.readAsDataURL(file);
  });
}
export default function TaiLieu() {
  useLanguage();
  const [data, setData] = useState(null), [error, setError] = useState('');
  const [title, setTitle] = useState(''), [text, setText] = useState(''), [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false), [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null), [viewError, setViewError] = useState(''), [loadingDoc, setLoadingDoc] = useState(false);
  const [deleting, setDeleting] = useState(null), [revision, setRevision] = useState(0);
  const lock = useRef(false), input = useRef(null), mutation = useRef(null);
  const { hienToast } = useToast();
  const [params, setParams] = useSearchParams();
  const docID = params.get('doc');
  const externalRevision = useDataRevision({ externalOnly: true });

  useEffect(() => {
    const abort = new AbortController();
    api.get('/tai-lieu', { signal: abort.signal }).then(res => { setData(res.data); setError(''); })
      .catch(e => { if (!abort.signal.aborted) setError(e.response?.data?.message || 'Chưa tải được kho tài liệu.'); });
    return () => abort.abort();
  }, [revision, externalRevision]);
  useEffect(() => {
    if (!docID) return;
    const abort = new AbortController();
    api.get('/tai-lieu/' + encodeURIComponent(docID), { signal: abort.signal }).then(res => { setSelected(res.data.taiLieu); setViewError(''); })
      .catch(e => { if (!abort.signal.aborted) setViewError(e.response?.data?.message || 'Không mở được tài liệu.'); })
      .finally(() => { if (!abort.signal.aborted) setLoadingDoc(false); });
    return () => abort.abort();
  }, [docID]);
  useEffect(() => () => mutation.current?.abort(), []);
  const open = useCallback(id => { setSelected(null); setViewError(''); setLoadingDoc(true); setParams({ doc: String(id) }); }, [setParams]);
  const close = () => { setParams({}); setSelected(null); setViewError(''); };

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (file && (file.size > 4 * 1024 * 1024 || !/\.(pdf|txt|md)$/i.test(file.name))) { setError('Chọn PDF, TXT hoặc MD, tối đa 4 MB.'); return; }
    const abort = new AbortController(); mutation.current = abort;
    lock.current = true; setBusy(true); setError('');
    try {
      const body = { tieuDe: title.trim() };
      if (file) body.tep = { ten: file.name, base64: await readBase64(file) }; else body.noiDung = text;
      if (abort.signal.aborted) return;
      const res = await api.post('/tai-lieu', body, { signal: abort.signal, timeout: 30000 });
      setTitle(''); setText(''); setFile(null); if (input.current) input.current.value = '';
      setShowForm(false); setRevision(n => n + 1); open(res.data.taiLieu.id);
      hienToast('success', 'Đã thêm tài liệu. Bạn có thể hỏi trợ lý ngay.');
    } catch (e) { if (!abort.signal.aborted) setError(e.response?.data?.message || e.message || 'Chưa thêm được tài liệu. Nội dung nhập vẫn được giữ.'); }
    finally { if (mutation.current === abort) { mutation.current = null; lock.current = false; setBusy(false); } }
  }
  async function remove() {
    if (!deleting || lock.current) return;
    lock.current = true; setBusy(true);
    const abort = new AbortController(); mutation.current = abort;
    try {
      await api.delete('/tai-lieu/' + deleting.id, { signal: abort.signal });
      if (String(deleting.id) === docID) close();
      setDeleting(null); setRevision(n => n + 1); setError('');
      hienToast('success', 'Đã xóa tài liệu khỏi kho.');
    } catch (e) { if (!abort.signal.aborted) { setDeleting(null); setError(e.response?.data?.message || 'Chưa xóa được tài liệu. Hãy thử lại.'); } }
    finally { if (mutation.current === abort) { mutation.current = null; lock.current = false; setBusy(false); } }
  }
  const documents = data ? [data.huongDan, ...data.taiLieus] : [];
  return (
    <div className="w-full min-w-0 space-y-6">
      <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"><ArrowLeft size={16} />{tr("Về Hôm nay")}</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">{tr("Kho tài liệu")}</h1><p className="mt-2 max-w-xl text-sm text-slate-500">{tr("Thêm tài liệu để trợ lý tìm nội dung và dẫn nguồn. Tài liệu bạn nhập chỉ thuộc tài khoản của bạn.")}</p></div>
        <button type="button" disabled={busy} onClick={() => setShowForm(v => !v)} aria-expanded={showForm} className={BUTTON + ' bg-ink-600 text-white'}><Plus size={18} />{showForm ? tr('Thu gọn') : tr('Thêm tài liệu')}</button>
      </header>
      {showForm && <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm font-medium">{tr("Tên tài liệu")}<input autoFocus required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder={tr("Ví dụ: Quy chế học tập của trường")} className={FIELD} /></label>
          <label className="block text-sm font-medium">{tr("Chọn PDF, TXT hoặc MD")}<input ref={input} type="file" accept=".pdf,.txt,.md" onChange={e => { const next = e.target.files?.[0] || null; setFile(next); if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, '').slice(0, 160)); }} className={FIELD} /></label>
          <p className="text-xs text-slate-500">{tr("Tối đa 4 MB, PDF có chữ tối đa 100 trang. PDF chụp/scan chưa hỗ trợ. Bạn có thể dán nội dung nếu đọc tệp không thành công.")}</p>
          {file ? <button type="button" className={BUTTON} onClick={() => { setFile(null); if (input.current) input.current.value = ''; }}>{tr("Bỏ tệp, dùng nội dung nhập")}</button>
            : <label className="block text-sm font-medium">{tr("Hoặc dán nội dung")}<textarea required minLength={40} maxLength={200000} rows={8} value={text} onChange={e => setText(e.target.value)} className={FIELD} placeholder={tr("Nội dung từ tài liệu của bạn, ít nhất 40 ký tự…")} /></label>}
          <p className="text-xs text-slate-500">{tr("Nội dung được lưu để tìm kiếm. Chỉ khi bạn chọn nhờ AI giải thích và đồng ý, các đoạn liên quan mới được gửi đến Google.")}</p>
          <button type="submit" className={BUTTON + ' bg-ink-600 text-white'}>{busy ? tr('Đang đọc và lưu…') : tr('Lưu tài liệu')}</button>
        </fieldset>
      </form>}
      {error && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><p>{tr(error)}</p><button className="mt-2 min-h-11 underline" onClick={() => setRevision(n => n + 1)}>{tr("Tải lại danh sách")}</button></div>}
      {!data && !error && <p role="status">{tr("Đang tải tài liệu…")}</p>}
      {data && <p className="text-xs text-slate-500">{data.taiLieus.length}/{data.gioiHan.soTaiLieu}{tr(" tài liệu riêng · ")}{data.gioiHan.kyTuDaDung.toLocaleString(getLocale())}/{data.gioiHan.tongKyTu.toLocaleString(getLocale())}{tr(" ký tự")}</p>}
      <div className="space-y-3">
        {documents.map(doc => <article key={doc.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700">
          <FileText size={22} className="mt-2 shrink-0 text-ink-500" />
          <div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{doc.tieuDe}</h2><p className="mt-1 break-words text-xs text-slate-500">{doc.tenTep}{tr(" · ")}{doc.soTrang} {doc.macDinh ? tr('mục hướng dẫn') : tr('trang/phần')}</p>
            <button type="button" className={BUTTON + ' mt-3'} onClick={() => open(doc.id)}><BookOpen size={16} />{tr("Đọc nội dung")}</button></div>
          {!doc.macDinh && <button type="button" disabled={busy} onClick={() => setDeleting(doc)} aria-label={tr('Xóa tài liệu ') + doc.tieuDe} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={18} /></button>}
        </article>)}
      </div>
      <p className="text-sm text-slate-500">{tr("Mở trợ lý ở góc màn hình → ")}<strong>{tr("Hỏi tài liệu")}</strong>{tr(". Ví dụ: “LifeHub tính GPA như thế nào?”")}</p>
      <ModalDialog open={Boolean(docID)} onClose={close} title={selected && String(selected.id) === docID ? selected.tieuDe : tr('Nội dung tài liệu')}>
        {(loadingDoc || (!selected && !viewError)) && <p role="status">{tr("Đang mở tài liệu…")}</p>}
        {viewError && <p role="alert" className="text-rose-600">{viewError}</p>}
        <div className="space-y-4">{selected && String(selected.id) === docID && selected.cacDoan.map(part => <section key={part.thuTu} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs text-slate-500">{selected.macDinh ? tr('Mục') : tr('Trang/phần')} {part.trang}{tr(" · Đoạn ")}{part.thuTu}</p>
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm">{part.noiDung}</p>
        </section>)}</div>

      </ModalDialog>
      <ModalDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title={tr("Xóa tài liệu?")} busy={busy}>
        <p className="mb-4 break-words text-sm">{tr("“")}{deleting?.tieuDe}{tr("” sẽ không còn được dùng cho câu hỏi mới. Các trích đoạn trong cuộc trò chuyện đang mở có thể vẫn còn; bắt đầu cuộc trò chuyện mới để xóa chúng.")}</p>
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDeleting(null)} className={BUTTON}>{tr("Giữ lại")}</button><button type="button" disabled={busy} onClick={remove} className={BUTTON + ' bg-rose-600 text-white'}>{busy ? tr('Đang xóa…') : tr('Xóa tài liệu')}</button></div>
      </ModalDialog>
    </div>
  );
}
