import { useState } from 'react';

export default function ChecklistEditor({ items = [], onChange, disabled = false }) {
  const [title, setTitle] = useState('');
  const done = items.filter((item) => item.done).length;
  function add() {
    if (!title.trim() || items.length >= 50 || disabled) return;
    onChange([...items, { id: crypto.randomUUID(), title: title.trim(), done: false }]);
    setTitle('');
  }
  return <div className="space-y-2 text-sm">
    <p className="font-medium text-slate-600">Các bước thực hiện {items.length > 0 && `· ${done}/${items.length} đã xong`}</p>
    {items.length > 0 && <progress aria-label="Tiến độ checklist" value={done} max={items.length} className="h-2 w-full accent-emerald-600" />}
    {items.map((item) => <div key={item.id} className="flex items-center gap-2">
      <label className="flex flex-1 min-w-0 items-start gap-2"><input type="checkbox" checked={item.done} disabled={disabled} onChange={() => onChange(items.map((step) => step.id === item.id ? { ...step, done: !step.done } : step))} className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"/><span className={`break-words min-w-0 ${item.done ? 'line-through text-slate-500' : 'text-slate-700'}`}>{item.title}</span></label>
      <button type="button" disabled={disabled} aria-label={`Xóa bước: ${item.title}`} onClick={() => onChange(items.filter((step) => step.id !== item.id))} className="p-2 text-slate-500 hover:text-rose-600">×</button>
    </div>)}
    {items.length < 50 && <div className="flex gap-2"><input aria-label="Tên bước mới" value={title} maxLength={200} disabled={disabled} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Ví dụ: Tìm tài liệu tham khảo" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2"/><button type="button" disabled={disabled || !title.trim()} onClick={add} className="rounded-lg px-3 py-2 bg-ink-50 text-ink-600 disabled:opacity-50">Thêm bước</button></div>}
  </div>;
}
