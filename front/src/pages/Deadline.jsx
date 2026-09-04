import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  X, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';

function Deadline() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [cheDoXem, setCheDoXem] = useState('list'); // 'list' | 'calendar'
  
  // Calendar state
  const [thangXemLich, setThangXemLich] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [ngayDuocChon, setNgayDuocChon] = useState(null);

  // Form state
  const [tieuDe, setTieuDe] = useState('');
  const [moTa, setMoTa] = useState('');
  const [hanChot, setHanChot] = useState('');
  const [doUuTien, setDoUuTien] = useState('binh_thuong');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const res = await api.get('/deadline');
      setDanhSach(res.data.deadlines || []);
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
    setTieuDe('');
    setMoTa('');
    setHanChot('');
    setDoUuTien('binh_thuong');
    setDangSuaId(null);
    setHienFormThem(!hienFormThem);
  }

  function moFormSua(d) {
    setTieuDe(d.tieuDe);
    setMoTa(d.moTa || '');
    setHanChot(new Date(d.hanChot).toISOString().slice(0, 16));
    setDoUuTien(d.doUuTien);
    setDangSuaId(d.id);
    setHienFormThem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    try {
      const data = { tieuDe, moTa, hanChot: new Date(hanChot).toISOString(), doUuTien };
      if (dangSuaId) {
        await api.put(`/deadline/${dangSuaId}`, data);
      } else {
        await api.post('/deadline', data);
      }
      setHienFormThem(false);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra!');
    }
  }

  async function xuLyXoa(id) {
    if (!window.confirm('Bạn có chắc muốn xóa deadline này?')) return;
    try {
      await api.delete(`/deadline/${id}`);
      taiDuLieu();
    } catch (error) {
      console.error(error);
    }
  }

  async function xuLyHoanThanh(id, dangHoanThanh) {
    try {
      await api.put(`/deadline/${id}`, { trangThai: dangHoanThanh ? 'cho_xu_ly' : 'hoan_thanh' });
      taiDuLieu();
    } catch (error) {
      console.error(error);
    }
  }

  function dinhDangNgay(chuoiNgay) {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(chuoiNgay).toLocaleDateString('vi-VN', options);
  }

  const badgeUuTien = (doUu) => {
    switch (doUu) {
      case 'cao':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      case 'thap':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    }
  };

  const textUuTien = (doUu) => {
    switch (doUu) {
      case 'cao': return 'Cao';
      case 'thap': return 'Thấp';
      default: return 'Thường';
    }
  };

  // --- LOGIC CALENDAR ---
  const taoLich = (thang) => {
    const nam = thang.getFullYear();
    const th = thang.getMonth();
    const ngayDauThang = new Date(nam, th, 1);
    const ngayCuoiThang = new Date(nam, th + 1, 0);
    const thuNgayDau = ngayDauThang.getDay() === 0 ? 6 : ngayDauThang.getDay() - 1; // T2 là 0
    const lich = [];
    let ngayHienTai = new Date(nam, th, 1 - thuNgayDau);

    for (let i = 0; i < 42; i++) {
      lich.push(new Date(ngayHienTai));
      ngayHienTai.setDate(ngayHienTai.getDate() + 1);
    }
    return lich;
  };

  const khoaNgay = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const homNay = new Date();
  
  const dangDienHanh = danhSach.filter((d) => d.trangThai !== 'hoan_thanh');
  const daHoanThanh = danhSach.filter((d) => d.trangThai === 'hoan_thanh');
  const deadlinesNgayDuocChon = ngayDuocChon
    ? danhSach.filter((d) => khoaNgay(new Date(d.hanChot)) === khoaNgay(ngayDuocChon))
    : [];

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản lý Deadline
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bạn có {dangDienHanh.length} công việc cần hoàn thành
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCheDoXem('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                cheDoXem === 'list' 
                ? 'bg-white dark:bg-slate-700 text-ink-600 dark:text-ink-200 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" /> Danh sách
            </button>
            <button
              onClick={() => setCheDoXem('calendar')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                cheDoXem === 'calendar' 
                ? 'bg-white dark:bg-slate-700 text-ink-600 dark:text-ink-200 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> Lịch
            </button>
          </div>
        </div>

        {/* Nút thêm mới */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-5 h-5 text-ink-500 dark:text-ink-300" />
            Sắp xếp công việc hiệu quả
          </span>
          <button
            onClick={moFormThem}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              hienFormThem 
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              : 'bg-ink-600 dark:bg-ink-500 text-white hover:bg-ink-700 dark:hover:bg-ink-400 shadow-sm shadow-ink-500/20'
            }`}
          >
            {hienFormThem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {hienFormThem ? 'Hủy' : 'Thêm deadline'}
          </button>
        </div>

        {/* Form thêm mới */}
        {hienFormThem && (
          <form
            onSubmit={xuLySubmit}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-500/40 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-ink-400" />
            <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-5 ml-2">
              {dangSuaId ? 'Cập nhật Deadline' : 'Tạo Deadline mới'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ml-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tiêu đề công việc</label>
                <input
                  type="text"
                  value={tieuDe}
                  onChange={(e) => setTieuDe(e.target.value)}
                  placeholder="Ví dụ: Nộp bài tập lớn môn CSDL"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Hạn chót</label>
                <input
                  type="datetime-local"
                  value={hanChot}
                  onChange={(e) => setHanChot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Độ ưu tiên</label>
                <select
                  value={doUuTien}
                  onChange={(e) => setDoUuTien(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                >
                  <option value="thap">Thấp (Có thể làm sau)</option>
                  <option value="binh_thuong">Bình thường</option>
                  <option value="cao">Cao (Khẩn cấp)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mô tả thêm (Tùy chọn)</label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Ghi chú thêm chi tiết, link tài liệu..."
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
                ></textarea>
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
                {dangSuaId ? 'Cập nhật' : 'Lưu công việc'}
              </button>
            </div>
          </form>
        )}

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : cheDoXem === 'calendar' ? (
          <>
            {/* Lịch View */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setThangXemLich(new Date(thangXemLich.getFullYear(), thangXemLich.getMonth() - 1, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
                  Tháng {thangXemLich.getMonth() + 1} - {thangXemLich.getFullYear()}
                </h2>
                <button
                  onClick={() => setThangXemLich(new Date(thangXemLich.getFullYear(), thangXemLich.getMonth() + 1, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((thu) => (
                  <div key={thu} className="text-center py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {thu}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {taoLich(thangXemLich).map((ngay, i) => {
                  const ds = danhSach.filter((d) => khoaNgay(new Date(d.hanChot)) === khoaNgay(ngay));
                  const laHomNay = khoaNgay(ngay) === khoaNgay(homNay);
                  const dangDuocChon = ngayDuocChon && khoaNgay(ngay) === khoaNgay(ngayDuocChon);
                  const khacThang = ngay.getMonth() !== thangXemLich.getMonth();
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setNgayDuocChon(ngay)}
                      className={`min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-700/30 text-left align-top hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                        dangDuocChon ? 'bg-ink-50/50 dark:bg-ink-900/30 border-ink-200 dark:border-ink-700 ring-1 ring-inset ring-ink-400' : ''
                      } ${khacThang ? 'bg-slate-50/50 dark:bg-slate-900/20' : 'bg-white dark:bg-slate-800'}`}
                    >
                      <span
                        className={`text-xs inline-flex items-center justify-center w-6 h-6 rounded-full font-medium mb-1 ${
                          laHomNay 
                          ? 'bg-ink-600 text-white shadow-sm' 
                          : khacThang 
                            ? 'text-slate-300 dark:text-slate-600' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ngay.getDate()}
                      </span>
                      <div className="space-y-1 mt-1">
                        {ds.slice(0, 3).map((d) => (
                          <div
                            key={d.id}
                            className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium ${
                              d.trangThai === 'hoan_thanh'
                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 line-through'
                                : badgeUuTien(d.doUuTien)
                            }`}
                            title={d.tieuDe}
                          >
                            {d.tieuDe}
                          </div>
                        ))}
                        {ds.length > 3 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
                            +{ds.length - 3} công việc
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết deadline của ngày */}
            {ngayDuocChon && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-ink-500" />
                  Công việc ngày {ngayDuocChon.toLocaleDateString('vi-VN')}
                </h3>
                {deadlinesNgayDuocChon.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mb-2 text-slate-200 dark:text-slate-700" />
                    <p>Trống! Bạn có thể thư giãn vào ngày này.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deadlinesNgayDuocChon.map((d) => (
                      <div key={d.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 group hover:border-slate-300 transition-colors">
                        <button onClick={() => xuLyHoanThanh(d.id, d.trangThai === 'hoan_thanh')} className="mt-0.5 flex-shrink-0">
                          {d.trangThai === 'hoan_thanh' 
                            ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> 
                            : <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-ink-500 transition-colors" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-semibold truncate ${d.trangThai === 'hoan_thanh' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                              {d.tieuDe}
                            </h4>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeUuTien(d.doUuTien)}`}>
                              {textUuTien(d.doUuTien)}
                            </span>
                          </div>
                          {d.moTa && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{d.moTa}</p>}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 
                              {new Date(d.hanChot).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moFormSua(d)} className="p-1.5 text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => xuLyXoa(d.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* List View */}
            <div className="space-y-8">
              
              {/* Đang diễn hành */}
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Cần hoàn thành ({dangDienHanh.length})
                </h2>
                
                {dangDienHanh.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-12 text-center text-slate-500">
                    Bạn đã hoàn thành mọi công việc! Tuyệt vời!
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {dangDienHanh.map((d) => (
                      <div key={d.id} className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-start gap-4 group hover:border-ink-300 dark:hover:border-ink-500 transition-colors">
                        <button onClick={() => xuLyHoanThanh(d.id, false)} className="mt-0.5 flex-shrink-0" title="Đánh dấu hoàn thành">
                          <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-emerald-500 hover:fill-emerald-50 transition-all" />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">{d.tieuDe}</h3>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeUuTien(d.doUuTien)}`}>
                                  {textUuTien(d.doUuTien)}
                                </span>
                              </div>
                              {d.moTa && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{d.moTa}</p>}
                            </div>
                            
                            <div className="flex items-center gap-3 md:flex-col md:items-end">
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Clock className="w-4 h-4 text-ink-500" />
                                {dinhDangNgay(d.hanChot)}
                              </div>
                            </div>
                          </div>
                          
                          {d.monHoc && (
                            <div className="mt-3 inline-block">
                              <span className="text-xs bg-ink-50 text-ink-700 dark:bg-ink-900/40 dark:text-ink-200 px-2 py-1 rounded-md font-medium border border-ink-100 dark:border-ink-700/60">
                                Môn: {d.monHoc.ten}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <button onClick={() => moFormSua(d)} className="p-2 text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => xuLyXoa(d.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Đã hoàn thành */}
              {daHoanThanh.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-lg text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Đã hoàn thành ({daHoanThanh.length})
                  </h2>
                  <div className="grid gap-2 opacity-70 hover:opacity-100 transition-opacity">
                    {daHoanThanh.map((d) => (
                      <div key={d.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 group">
                        <button onClick={() => xuLyHoanThanh(d.id, true)} className="flex-shrink-0" title="Hoàn tác">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-500 dark:text-slate-400 line-through truncate">{d.tieuDe}</h3>
                        </div>
                        <div className="text-xs text-slate-400 flex-shrink-0 mr-4">
                          {dinhDangNgay(d.hanChot)}
                        </div>
                        <button onClick={() => xuLyXoa(d.id)} className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Deadline;
