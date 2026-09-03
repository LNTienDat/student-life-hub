import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Target,
  Download
} from 'lucide-react';

function MonHoc() {
  const [danhSach, setDanhSach] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [gpaTheoKy, setGpaTheoKy] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);

  const [monThemDiemId, setMonThemDiemId] = useState(null);
  const [loaiDanhGia, setLoaiDanhGia] = useState('');
  const [diemSo, setDiemSo] = useState('');
  const [trongSo, setTrongSo] = useState('');

  const [tenMon, setTenMon] = useState('');
  const [tinChi, setTinChi] = useState('');
  const [hocKy, setHocKy] = useState('');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const [resMonHoc, resGpa, resGpaKy] = await Promise.all([
        api.get('/academic/mon-hoc'),
        api.get('/academic/gpa'),
        api.get('/academic/gpa-theo-ky'),
      ]);
      setDanhSach(resMonHoc.data.monHocs || []);
      setGpa(resGpa.data.gpa);
      setGpaTheoKy(resGpaKy.data.theoKy || []);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    taiDuLieu();
  }, []);

  function moFormSua(mon) {
    setTenMon(mon.ten);
    setTinChi(mon.tinChi);
    setHocKy(mon.hocKy);
    setDangSuaId(mon.id);
    setHienFormThem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moFormThem() {
    setTenMon('');
    setTinChi('');
    setHocKy('');
    setDangSuaId(null);
    setHienFormThem(!hienFormThem);
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    try {
      if (dangSuaId) {
        await api.put(`/academic/mon-hoc/${dangSuaId}`, { ten: tenMon, tinChi: Number(tinChi), hocKy });
      } else {
        await api.post('/academic/mon-hoc', { ten: tenMon, tinChi: Number(tinChi), hocKy });
      }
      setHienFormThem(false);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra!');
    }
  }

  async function xuLyXoaMon(id) {
    if (!window.confirm('Bạn có chắc muốn xóa môn này không? Dữ liệu điểm sẽ bị mất.')) return;
    try {
      await api.delete(`/academic/mon-hoc/${id}`);
      taiDuLieu();
    } catch (error) {
      console.error(error);
    }
  }

  function tinhDiemMon(diems) {
    if (!diems || diems.length === 0) return null;
    let tongDiem = 0;
    let tongTrongSo = 0;
    diems.forEach(d => {
      tongDiem += (d.diem * d.trongSo);
      tongTrongSo += d.trongSo;
    });
    return tongTrongSo > 0 ? (tongDiem / tongTrongSo).toFixed(2) : null;
  }

  function moFormThemDiem(monId) {
    setMonThemDiemId(monThemDiemId === monId ? null : monId);
    setLoaiDanhGia('');
    setDiemSo('');
    setTrongSo('');
  }

  async function xuLyThemDiem(e, monId) {
    e.preventDefault();
    try {
      await api.post(`/academic/mon-hoc/${monId}/diem`, {
        loaiDanhGia,
        diem: parseFloat(diemSo),
        trongSo: parseFloat(trongSo)
      });
      setMonThemDiemId(null);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      alert('Không thể lưu điểm!');
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Học tập & Điểm số
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Quản lý tiến độ học tập và theo dõi GPA
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">GPA Hiện tại</span>
                <span className="font-display font-bold text-slate-900 dark:text-white leading-none">
                  {gpa ? Number(gpa).toFixed(2) : '--'}
                </span>
              </div>
            </div>
            <button
              onClick={moFormThem}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                hienFormThem 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-ink-600 dark:bg-blue-600 text-white hover:bg-ink-700 dark:hover:bg-blue-700 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienFormThem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienFormThem ? 'Hủy' : 'Thêm môn học'}
            </button>
          </div>
        </div>

        {gpaTheoKy.length > 1 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
            <h2 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-ink-500 dark:text-blue-400" />
              Biểu đồ GPA theo học kỳ
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gpaTheoKy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="hocKy" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <YAxis domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="gpa" fill="#3D3F72" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hienFormThem && (
          <form
            onSubmit={xuLySubmit}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-blue-500/30 flex flex-col md:flex-row gap-4 items-end relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-blue-500" />
            <div className="flex-1 w-full pl-2">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tên môn học</label>
              <input
                type="text"
                value={tenMon}
                onChange={(e) => setTenMon(e.target.value)}
                placeholder="VD: Toán cao cấp"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                required
              />
            </div>
            <div className="w-full md:w-28">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tín chỉ</label>
              <input
                type="number"
                value={tinChi}
                onChange={(e) => setTinChi(e.target.value)}
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                required
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Học kỳ</label>
              <input
                type="text"
                value={hocKy}
                onChange={(e) => setHocKy(e.target.value)}
                placeholder="VD: HK1 2024"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {dangSuaId ? 'Cập nhật' : 'Lưu môn học'}
            </button>
          </form>
        )}

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : danhSach.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">Chưa có môn học nào</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Hãy thêm môn học đầu tiên để bắt đầu theo dõi tiến độ và điểm số của bạn.</p>
            <button
              onClick={moFormThem}
              className="mt-6 flex items-center gap-2 bg-ink-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-ink-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm môn học
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {danhSach.map((mon) => {
              const diemMon = tinhDiemMon(mon.diems);
              const quaMon = diemMon && parseFloat(diemMon) >= 5;
              
              return (
                <div key={mon.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight line-clamp-2" title={mon.ten}>
                        {mon.ten}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                          {mon.tinChi} TC
                        </span>
                        <span>•</span>
                        <span>{mon.hocKy}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {diemMon ? (
                        <div className={`flex flex-col items-end ${quaMon ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          <span className="font-display text-2xl font-bold leading-none">{diemMon}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider mt-1">{quaMon ? 'Đạt' : 'Chưa đạt'}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end text-slate-400">
                          <span className="font-display text-2xl font-bold leading-none">--</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider mt-1">Chưa có</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {mon.diems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mon.diems.map((d) => (
                          <span
                            key={d.id}
                            className="text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-200">{d.loaiDanhGia}</span> 
                            <span className="text-slate-400">|</span> 
                            <span className="font-bold">{d.diem}</span> 
                            <span className="text-slate-400 text-[10px]">({d.trongSo}%)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-auto">
                    {monThemDiemId === mon.id ? (
                      <form
                        onSubmit={(e) => xuLyThemDiem(e, mon.id)}
                        className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm flex flex-col gap-2.5"
                      >
                        <input
                          type="text"
                          placeholder="Loại điểm (VD: Giữa kỳ)"
                          value={loaiDanhGia}
                          onChange={(e) => setLoaiDanhGia(e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                          required
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Điểm"
                            value={diemSo}
                            onChange={(e) => setDiemSo(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Trọng số (%)"
                            value={trongSo}
                            onChange={(e) => setTrongSo(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                            required
                          />
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setMonThemDiemId(null)}
                            className="flex-1 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-xs"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="flex-1 text-white bg-ink-600 hover:bg-ink-700 dark:bg-blue-600 dark:hover:bg-blue-700 py-1.5 rounded-lg font-medium text-xs transition-colors"
                          >
                            Lưu điểm
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => moFormThemDiem(mon.id)}
                          className="text-ink-600 dark:text-blue-400 text-xs font-medium hover:text-ink-800 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm điểm
                        </button>
                        <div className="flex gap-3">
                          <button
                            onClick={() => moFormSua(mon)}
                            className="text-slate-400 hover:text-ink-600 dark:hover:text-blue-400 transition-colors"
                            title="Sửa môn học"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => xuLyXoaMon(mon.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                            title="Xóa môn học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default MonHoc;
