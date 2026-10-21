// Development-only manual fixture. Not included in the production entry point.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import SemesterPicker from '../src/components/SemesterPicker';
import Dashboard from '../src/pages/Dashboard';
import Deadline from '../src/pages/Deadline';
import MonHoc from '../src/pages/MonHoc';
import ThoiKhoaBieu from '../src/pages/ThoiKhoaBieu';
import api from '../src/services/api';
import '../src/index.css';

if (window.location.hostname !== '127.0.0.1' || window.location.port !== '5187') {
  throw new Error('Mở bản kiểm tra trên http://127.0.0.1:5187 để giữ tách biệt tài khoản thật.');
}
localStorage.setItem('user', JSON.stringify({ id: 'preview-only', ten: 'Sinh viên xem thử' }));
const date = new Date(); date.setDate(date.getDate() + 1);
const subjects = [{ id: 1, ten: 'Cơ sở dữ liệu', tinChi: 3, hocKy: 'HK1 2026–2027', diems: [{ id: 1, loaiDanhGia: 'Giữa kỳ', diem: 7.5, trongSo: 40 }] }];
let tasks = [{ id: 1, tieuDe: 'Hoàn thiện báo cáo đồ án', hanChot: date.toISOString(), trangThai: 'dang_dien_hanh', doUuTien: 'cao', monHoc: { ten: 'Cơ sở dữ liệu' }, checklist: [{ id: 'step-1', title: 'Tìm tài liệu tham khảo', done: true }, { id: 'step-2', title: 'Viết báo cáo', done: false }] }];
const classes = [{ id: 1, tenMon: 'Cơ sở dữ liệu', thu: new Date().getDay() === 0 ? 8 : new Date().getDay() + 1, gioBatDau: '07:00', gioKetThuc: '09:00', phongHoc: 'B.201', hocKy: 'HK1 2026–2027' }];
api.defaults.adapter = async (config) => {
  let data = {};
  if (config.url === '/academic/mon-hoc') data = { monHocs: subjects };
  if (config.url === '/academic/gpa') data = { gpa: '7.50' };
  if (config.url === '/academic/gpa-theo-ky') data = { theoKy: [{ hocKy: 'HK1 2026–2027', gpa: '7.50' }] };
  if (config.url === '/academic/canh-bao') data = { monNguyCo: [] };
  if (config.url === '/deadline' || config.url === '/deadline/sap-toi') data = { deadlines: tasks };
  if (config.url === '/thoi-khoa-bieu') data = { thoiKhoaBieu: classes };
  if (config.url === '/finance/thong-ke') data = { soDu: 1500000, theoDanhMuc: { an_uong: 500000 } };
  if (config.url === '/finance/ngan-sach') data = { ketQua: [{ danhMuc: 'an_uong', soTienToiDa: 1500000, daChi: 500000 }] };
  if (config.method === 'put' && config.url.startsWith('/deadline/')) { const update = JSON.parse(config.data); tasks = tasks.map((item) => item.id === Number(config.url.split('/').pop()) ? { ...item, ...update } : item); data = { deadline: tasks[0] }; }
  if (config.method === 'patch' && config.url.endsWith('/hoan-thanh')) tasks = [];
  if (config.method === 'post' && config.url === '/deadline') { tasks.push({ ...JSON.parse(config.data), id: Date.now(), trangThai: 'dang_dien_hanh', checklist: [] }); }
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
function Preview() {
  const [page, setPage] = useState('dashboard');
  const [dark, setDark] = useState(false);
  const views = { dashboard: Dashboard, deadline: Deadline, subjects: MonHoc, timetable: ThoiKhoaBieu };
  const View = views[page];
  return <main className="mx-auto max-w-6xl p-4 sm:p-6"><div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Bản kiểm tra · dữ liệu minh họa, không ghi vào tài khoản thật</div><div className="mb-4 flex flex-wrap gap-3">{Object.keys(views).map((key) => <button key={key} className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={() => setPage(key)}>{key}</button>)}<button className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={() => { document.documentElement.classList.toggle('dark'); setDark(!dark); }}>{dark ? 'Chế độ sáng' : 'Chế độ tối'}</button></div><SemesterPicker/><View key={page}/></main>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><ToastProvider><Preview/></ToastProvider></AuthProvider></BrowserRouter>);
