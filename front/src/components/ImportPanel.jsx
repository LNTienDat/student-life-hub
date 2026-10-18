import { useRef, useState } from 'react';
import api from '../services/api';

const headers = { subjects: ['ten', 'tinChi', 'hocKy'], timetable: ['tenMon', 'thu', 'gioBatDau', 'gioKetThuc', 'phongHoc', 'giangVien', 'hocKy'] };
export default function ImportPanel({ kind, onImported }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [upload, setUpload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);
  async function read(event) {
    const file = event.target.files[0];
    setPreview(null); setUpload(null); setMessage('');
    if (!file) return;
    if (file.size > 1024 * 1024 || !/\.(xlsx|csv)$/i.test(file.name)) { setMessage('Chọn tệp .xlsx hoặc .csv không quá 1 MB.'); return; }
    setBusy(true);
    try {
      const content = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      const payload = { kind, filename: file.name, content };
      const result = await api.post('/imports/preview', payload);
      setUpload(payload); setPreview(result.data);
    } catch (error) { setMessage(error.response?.data?.message || 'Không đọc được tệp. Kiểm tra định dạng và thử lại.'); }
    finally { setBusy(false); }
  }
  function template() {
    const sample = kind === 'subjects' ? ['Cơ sở dữ liệu', '3', 'HK1 2026–2027'] : ['Cơ sở dữ liệu', '2', '07:00', '09:00', 'A201', 'Nguyễn Văn An', 'HK1 2026–2027'];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + headers[kind].join(',') + '\r\n' + sample.join(',')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${kind}-mau.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function commit() {
    if (busy || !upload) return;
    setBusy(true); setMessage('');
    try {
      const { data } = await api.post('/imports/commit', upload);
      setPreview(null); setUpload(null); if (fileRef.current) fileRef.current.value = '';
      setMessage(`Đã nhập ${data.count} dòng; bỏ qua ${data.skipped} dòng đã có.`);
      onImported();
    } catch (error) { setMessage(error.response?.data?.message || 'Chưa nhập được. Vui lòng thử lại.'); if (error.response?.data?.preview) setPreview(error.response.data.preview); }
    finally { setBusy(false); }
  }
  const invalid = preview?.rows.some((row) => row.errors.length);
  const count = preview?.rows.filter((row) => !row.errors.length && !row.skip).length || 0;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="font-semibold text-ink-600">{open ? 'Ẩn nhập tệp' : 'Nhập từ Excel / CSV'}</button>
    {open && <div className="mt-4 space-y-3">
      <p className="text-slate-500">Tối đa 500 dòng, 1 MB. Dùng đúng cột trong mẫu; Excel chỉ có một trang tính. Các dòng đã tồn tại sẽ được bỏ qua.</p>
      <div className="flex flex-wrap gap-3 items-center"><button type="button" onClick={template} className="rounded-lg border px-3 py-2">Tải mẫu CSV</button><label className="min-w-0">Chọn tệp<input ref={fileRef} type="file" accept=".csv,.xlsx" disabled={busy} onChange={read} className="block mt-1 max-w-full"/></label></div>
      {busy && <p role="status">Đang xử lý…</p>}
      {message && <p role="status" className="text-slate-700">{message}</p>}
      {preview && <>
        <p>{preview.rows.length} dòng · {count} dòng mới · {preview.rows.filter((row) => row.skip).length} đã có · {preview.rows.filter((row) => row.errors.length).length} dòng lỗi</p>
        <div className="max-h-80 overflow-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="bg-slate-50"><tr><th className="p-2">Dòng</th>{preview.columns.map((name) => <th key={name} className="p-2">{name}</th>)}<th className="p-2">Kiểm tra</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.line} className="border-t"><td className="p-2">{row.line}</td>{preview.columns.map((name) => <td key={name} className="p-2 max-w-48 break-words">{String(row.data[name] ?? '')}</td>)}<td className={`p-2 min-w-40 ${row.errors.length ? 'text-rose-600' : 'text-slate-600'}`}>{row.errors.join(' ') || (row.skip ? 'Đã có · bỏ qua' : 'Hợp lệ')}</td></tr>)}</tbody></table></div>
        {invalid && <p role="alert" className="text-rose-600">Sửa các dòng lỗi trong tệp rồi chọn lại. Chưa có dữ liệu nào được lưu.</p>}
        <button type="button" disabled={busy || invalid || !count} onClick={commit} className="rounded-xl bg-ink-600 px-4 py-2 text-white disabled:opacity-50">Xác nhận nhập {count} dòng</button>
      </>}
    </div>}
  </section>;
}
