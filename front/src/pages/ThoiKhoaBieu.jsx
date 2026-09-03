import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Clock, 
  MapPin, 
  User, 
  Edit2, 
  Trash2,
  CalendarDays
} from 'lucide-react';

const CAC_THU = [
  { gia: 2, ten: 'Thứ 2', tat: 'T2' },
  { gia: 3, ten: 'Thứ 3', tat: 'T3' },
  { gia: 4, ten: 'Thứ 4', tat: 'T4' },
  { gia: 5, ten: 'Thứ 5', tat: 'T5' },
  { gia: 6, ten: 'Thứ 6', tat: 'T6' },
  { gia: 7, ten: 'Thứ 7', tat: 'T7' },
  { gia: 8, ten: 'Chủ nhật', tat: 'CN' },
];

const MAU_MON = [
  'bg-blue-50/80 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  'bg-violet-50/80 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300',
  'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300',
  'bg-cyan-50/80 border-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300',
  'bg-fuchsia-50/80 border-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-300',
];

function mauChoMon(tenMon) {
  let hash = 0;
  for (let i = 0; i < tenMon.length; i++) hash = tenMon.charCodeAt(i) + ((hash << 5) - hash);
  return MAU_MON[Math.abs(hash) % MAU_MON.length];
}

function gioSangPhut(gio) {
  if (!gio) return 0;
  const [g, p] = gio.split(':').map(Number);
  return g * 60 + p;
}

function ThoiKhoaBieu() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienForm, setHienForm] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);

  const [tenMon, setTenMon] = useState('');
  const [thu, setThu] = useState(2);
  const [gioBatDau, setGioBatDau] = useState('07:00');
  const [gioKetThuc, setGioKetThuc] = useState('09:00');
  const [phongHoc, setPhongHoc] = useState('');
  const [giangVien, setGiangVien] = useState('');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const res = await api.get('/thoi-khoa-bieu');
      setDanhSach(res.data.thoiKhoaBieu || []);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    taiDuLieu();
  }, []);

  function moFormThem() {
    setDangSuaId(null);
    setTenMon('');
    setThu(2);
    setGioBatDau('07:00');
    setGioKetThuc('09:00');
    setPhongHoc('');
    setGiangVien('');
    setHienForm(!hienForm);
  }

  function moFormSua(bh) {
    setHienForm(true);
    setDangSuaId(bh.id);
    setTenMon(bh.tenMon);
    setThu(bh.thu);
    setGioBatDau(bh.gioBatDau);
    setGioKetThuc(bh.gioKetThuc);
    setPhongHoc(bh.phongHoc || '');
    setGiangVien(bh.giangVien || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    if (gioSangPhut(gioKetThuc) <= gioSangPhut(gioBatDau)) {
      alert('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }
    try {
      const data = { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien };
      if (dangSuaId) {
        await api.put(`/thoi-khoa-bieu/${dangSuaId}`, data);
      } else {
        await api.post('/thoi-khoa-bieu', data);
      }
      setHienForm(false);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyXoa(id) {
    if (!window.confirm('Xóa buổi học này khỏi thời khóa biểu?')) return;
    try {
      await api.delete(`/thoi-khoa-bieu/${id}`);
      taiDuLieu();
    } catch (error) {
      alert('Xóa thất bại');
    }
  }

  const buoiTheoThu = CAC_THU.reduce((map, t) => {
    map[t.gia] = danhSach
      .filter((bh) => bh.thu === t.gia)
      .sort((a, b) => gioSangPhut(a.gioBatDau) - gioSangPhut(b.gioBatDau));
    return map;
  }, {});

  const soMonHoc = danhSach.length;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Thời khóa biểu tuần
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bạn có {soMonHoc} buổi học trong tuần này
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={moFormThem}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                hienForm 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-ink-600 dark:bg-blue-600 text-white hover:bg-ink-700 dark:hover:bg-blue-700 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienForm ? 'Hủy' : 'Thêm buổi học'}
            </button>
          </div>
        </div>

        {/* Form thêm mới */}
        {hienForm && (
          <form
            onSubmit={xuLySubmit}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-blue-500/30 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-blue-500" />
            <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-5 ml-2">
              {dangSuaId ? 'Cập nhật buổi học' : 'Thêm buổi học mới'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 ml-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tên môn học</label>
                <input
                  value={tenMon}
                  onChange={(e) => setTenMon(e.target.value)}
                  placeholder="VD: Toán cao cấp A1"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Thứ</label>
                <select
                  value={thu}
                  onChange={(e) => setThu(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                >
                  {CAC_THU.map((t) => (
                    <option key={t.gia} value={t.gia}>{t.ten}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={gioBatDau}
                    onChange={(e) => setGioBatDau(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={gioKetThuc}
                    onChange={(e) => setGioKetThuc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phòng học (Tùy chọn)</label>
                <input
                  value={phongHoc}
                  onChange={(e) => setPhongHoc(e.target.value)}
                  placeholder="VD: D5-201"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giảng viên (Tùy chọn)</label>
                <input
                  value={giangVien}
                  onChange={(e) => setGiangVien(e.target.value)}
                  placeholder="VD: TS. Nguyễn Văn A"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 ml-2">
              <button
                type="button"
                onClick={moFormThem}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
              >
                {dangSuaId ? 'Cập nhật' : 'Lưu buổi học'}
              </button>
            </div>
          </form>
        )}

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải thời khóa biểu...</p>
          </div>
        ) : soMonHoc === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">Lịch học trống</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Bạn chưa có buổi học nào. Hãy bắt đầu thêm các môn học vào thời khóa biểu nhé.</p>
            <button
              onClick={moFormThem}
              className="mt-6 flex items-center gap-2 bg-ink-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-ink-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm buổi học
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            {/* Desktop View (Grid) */}
            <div className="hidden md:grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50">
              {CAC_THU.map((t) => (
                <div key={t.gia} className="text-center py-4 border-r last:border-r-0 border-slate-200 dark:border-slate-700/60">
                  <span className="font-display font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-sm">{t.ten}</span>
                </div>
              ))}
            </div>

            <div className="hidden md:grid grid-cols-7">
              {CAC_THU.map((t) => (
                <div key={t.gia} className="min-h-[400px] border-r last:border-r-0 border-slate-200 dark:border-slate-700/60 p-2 bg-white dark:bg-slate-800">
                  <div className="space-y-3 h-full">
                    {buoiTheoThu[t.gia].length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 py-10 opacity-50">
                        <CalendarIcon className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">Trống</span>
                      </div>
                    ) : (
                      buoiTheoThu[t.gia].map((bh) => (
                        <div
                          key={bh.id}
                          className={`group relative rounded-xl p-3 border transition-all hover:-translate-y-0.5 hover:shadow-md ${mauChoMon(bh.tenMon)}`}
                        >
                          <h4 className="font-bold text-sm leading-tight mb-2 pr-4">{bh.tenMon}</h4>
                          <div className="space-y-1.5 text-xs font-medium opacity-90">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {bh.gioBatDau} - {bh.gioKetThuc}
                            </div>
                            {bh.phongHoc && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                {bh.phongHoc}
                              </div>
                            )}
                            {bh.giangVien && (
                              <div className="flex items-center gap-1.5 truncate" title={bh.giangVien}>
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{bh.giangVien}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions hover */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moFormSua(bh)} className="p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-slate-700 dark:text-slate-200">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => xuLyXoa(bh.id)} className="p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-rose-600 dark:text-rose-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View (List) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              {CAC_THU.map((t) => {
                if (buoiTheoThu[t.gia].length === 0) return null;
                return (
                  <div key={t.gia} className="p-4">
                    <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                        {t.tat}
                      </span>
                      {t.ten}
                    </h3>
                    <div className="space-y-3">
                      {buoiTheoThu[t.gia].map((bh) => (
                        <div
                          key={bh.id}
                          className={`relative rounded-xl p-4 border ${mauChoMon(bh.tenMon)}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-base leading-tight pr-4">{bh.tenMon}</h4>
                            <div className="flex items-center gap-2">
                              <button onClick={() => moFormSua(bh)} className="p-1.5 bg-white/50 dark:bg-black/20 rounded shadow-sm">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => xuLyXoa(bh.id)} className="p-1.5 bg-white/50 dark:bg-black/20 rounded shadow-sm text-rose-600 dark:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm font-medium opacity-90 mt-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {bh.gioBatDau} - {bh.gioKetThuc}
                            </div>
                            {bh.phongHoc && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {bh.phongHoc}
                              </div>
                            )}
                            {bh.giangVien && (
                              <div className="flex items-center gap-1.5 col-span-2 truncate">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{bh.giangVien}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ThoiKhoaBieu;
