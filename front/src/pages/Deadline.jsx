import { useState, useEffect } from 'react';
import deadlineService from '../services/deadlineService';
import academicService from '../services/academicService';
import { clearCache } from '../services/apiCache';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { dinhDangNgay } from '../utils/formatters';
import { Calendar as CalendarIcon, List, Plus, X, Clock } from 'lucide-react';

import DeadlineForm from './deadline/DeadlineForm';
import DeadlineCalendarView from './deadline/DeadlineCalendarView';
import DeadlineListView from './deadline/DeadlineListView';

function Deadline() {
  const [danhSach, setDanhSach] = useState([]);
  const [danhSachMonHoc, setDanhSachMonHoc] = useState([]);
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
  const [idMonHoc, setIdMonHoc] = useState('');

  // State modal xác nhận
  const [modalXacNhan, setModalXacNhan] = useState({
    isOpen: false,
    title: '',
    subTitle: '',
    itemInfo: null,
    message: '',
    confirmText: 'Xóa',
    cancelText: 'Hủy bỏ',
    type: 'danger',
    isLoading: false,
    onConfirm: () => {},
  });

  const { hienToast } = useToast();

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const [resDeadline, resMon] = await Promise.all([
        deadlineService.layDanhSachDeadline(),
        academicService.layDanhSachMonHoc(),
      ]);
      setDanhSachMonHoc(resMon.data.monHocs || []);
      setDanhSach(resDeadline.data.deadlines || []);
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
    setIdMonHoc('');
    setDangSuaId(null);
    setHienFormThem(!hienFormThem);
  }

  function moFormSua(d) {
    setTieuDe(d.tieuDe);
    setMoTa(d.moTa || '');
    setHanChot(new Date(d.hanChot).toISOString().slice(0, 16));
    setDoUuTien(d.doUuTien);
    setIdMonHoc(d.idMonHoc ? String(d.idMonHoc) : '');
    setDangSuaId(d.id);
    setHienFormThem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    try {
      const data = {
        tieuDe,
        moTa,
        hanChot: new Date(hanChot).toISOString(),
        doUuTien,
        idMonHoc: idMonHoc ? parseInt(idMonHoc) : null,
      };
      if (dangSuaId) {
        await deadlineService.suaDeadline(dangSuaId, data);
        hienToast('success', `Đã cập nhật deadline "${tieuDe}"!`);
      } else {
        await deadlineService.themDeadline(data);
        hienToast('success', `Đã tạo deadline "${tieuDe}"!`);
      }
      clearCache('dashboard_cache');
      setHienFormThem(false);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Có lỗi xảy ra! Hãy kiểm tra kết nối Backend.');
    }
  }

  function yeuCauXoa(d) {
    setModalXacNhan({
      isOpen: true,
      title: 'Xác nhận xóa deadline',
      subTitle: d.monHoc?.ten ? `Môn: ${d.monHoc.ten}` : '',
      itemInfo: {
        label: d.tieuDe,
        value: dinhDangNgay(d.hanChot),
        extra: d.doUuTien === 'cao' ? 'Ưu tiên cao' : d.doUuTien === 'thap' ? 'Ưu tiên thấp' : 'Bình thường',
      },
      message: 'Bạn có chắc chắn muốn xóa deadline này không? Thao tác này không thể hoàn tác.',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      onConfirm: () => thucHienXoa(d.id),
    });
  }

  async function thucHienXoa(id) {
    try {
      setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
      await deadlineService.xoaDeadline(id);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', 'Đã xóa deadline thành công!');
      clearCache('dashboard_cache');
      taiDuLieu();
    } catch (error) {
      console.error(error);
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Không thể xóa deadline!');
    }
  }

  async function xuLyHoanThanh(id, dangHoanThanh) {
    try {
      await deadlineService.suaDeadline(id, { trangThai: dangHoanThanh ? 'cho_xu_ly' : 'hoan_thanh' });
      hienToast(
        'success',
        dangHoanThanh ? 'Đã hoàn tác trạng thái deadline' : 'Chúc mừng bạn đã hoàn thành deadline! 🎉'
      );
      clearCache('dashboard_cache');
      taiDuLieu();
    } catch (error) {
      console.error(error);
      hienToast('error', 'Không thể cập nhật trạng thái deadline');
    }
  }

  function doiThang(denta) {
    setThangXemLich(new Date(thangXemLich.getFullYear(), thangXemLich.getMonth() + denta, 1));
  }

  const dangDienHanh = danhSach.filter((d) => d.trangThai !== 'hoan_thanh');
  const daHoanThanh = danhSach.filter((d) => d.trangThai === 'hoan_thanh');

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
              aria-label="Xem dạng danh sách"
              aria-pressed={cheDoXem === 'list'}
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
              aria-label="Xem dạng lịch"
              aria-pressed={cheDoXem === 'calendar'}
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
        <DeadlineForm
          hienFormThem={hienFormThem}
          dangSuaId={dangSuaId}
          tieuDe={tieuDe}
          moTa={moTa}
          hanChot={hanChot}
          doUuTien={doUuTien}
          idMonHoc={idMonHoc}
          danhSachMonHoc={danhSachMonHoc}
          onTieuDeChange={setTieuDe}
          onMoTaChange={setMoTa}
          onHanChotChange={setHanChot}
          onDoUuTienChange={setDoUuTien}
          onIdMonHocChange={setIdMonHoc}
          onSubmit={xuLySubmit}
          onCancel={moFormThem}
        />

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : cheDoXem === 'calendar' ? (
          <DeadlineCalendarView
            thangXemLich={thangXemLich}
            ngayDuocChon={ngayDuocChon}
            danhSach={danhSach}
            onChonNgay={setNgayDuocChon}
            onDoiThang={doiThang}
            onHoanThanh={xuLyHoanThanh}
            onSua={moFormSua}
            onXoa={yeuCauXoa}
          />
        ) : (
          <DeadlineListView
            dangDienHanh={dangDienHanh}
            daHoanThanh={daHoanThanh}
            onHoanThanh={xuLyHoanThanh}
            onSua={moFormSua}
            onXoa={yeuCauXoa}
          />
        )}
      </div>

      {/* Modal xác nhận xóa hiện đại */}
      <ConfirmModal
        isOpen={modalXacNhan.isOpen}
        onClose={() => setModalXacNhan((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalXacNhan.onConfirm}
        title={modalXacNhan.title}
        subTitle={modalXacNhan.subTitle}
        itemInfo={modalXacNhan.itemInfo}
        message={modalXacNhan.message}
        confirmText={modalXacNhan.confirmText}
        cancelText={modalXacNhan.cancelText}
        type={modalXacNhan.type}
        isLoading={modalXacNhan.isLoading}
      />
    </>
  );
}

export default Deadline;
