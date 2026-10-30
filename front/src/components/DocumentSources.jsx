import { Link } from 'react-router-dom';
export default function DocumentSources({ sources, onOpen }) {
  if (!sources?.length) return null;
  return <div className="mt-3 space-y-2" aria-label="Nguồn tài liệu">
    {sources.map(source => <details key={source.ma} className="rounded-lg border border-slate-300 p-2 dark:border-slate-500">
      <summary className="cursor-pointer break-words text-xs font-semibold">[{source.ma}] {source.tieuDe} · {source.idTaiLieu === 'huong-dan-lifehub' ? 'Mục' : 'Trang/phần'} {source.trang}</summary>
      <blockquote className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] border-l-2 border-ink-300 pl-2 text-xs">{source.noiDung}</blockquote>
      <Link to={'/tai-lieu?doc=' + encodeURIComponent(source.idTaiLieu)} onClick={onOpen} className="mt-2 inline-flex min-h-11 items-center text-xs font-medium underline">Mở tài liệu gốc đã trích xuất</Link>
    </details>)}
  </div>;
}
