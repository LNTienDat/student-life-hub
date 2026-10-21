import DataLoadError from '../components/DataLoadError';
import ImportPanel from '../components/ImportPanel';
import { useSemester } from '../hooks/useSemester';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import timetableService from '../services/timetableService';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { Plus, X, CalendarDays, Share2 } from 'lucide-react';
import { CAC_THU, gioSangPhut } from './thoikhoabieu/timetableUtils';

import TimetableForm from './thoikhoabieu/TimetableForm';
import TimetableGrid from './thoikhoabieu/TimetableGrid';
import TimetableMobile from './thoikhoabieu/TimetableMobile';
import TimetableShareModal from './thoikhoabieu/TimetableShareModal';
import { PageSkeleton } from '../components/Skeleton';

function ThoiKhoaBieu() {
  const [semester] = useSemester();
  const [classSemester, setClassSemester] = useState(semester);
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [hienForm, setHienForm] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [hienModalShare, setHienModalShare] = useState(false);

  const [tenMon, setTenMon] = useState('');
  const [thu, setThu] = useState(2);
  const [gioBatDau, setGioBatDau] = useState('07:00');
  const [gioKetThuc, setGioKetThuc] = useState('09:00');
  const [phongHoc, setPhongHoc] = useState('');
  const [giangVien, setGiangVien] = useState('');

  // State modal xác nhận hiện đại
  const [modalXacNhan, setModalXacNhan] = useState({
    isOpen: false,
    title: '',
    subTitle: '',
    itemInfo: null,
    message: '',
    confirmText: 'Xác nhận xóa',
    cancelText: 'Hủy bỏ',
    type: 'danger',
    isLoading: false,
    onConfirm: () => {},
  });

  const { hienToast } = useToast();

  const loadVersion = useRef(0);
  const taiDuLieu = useCallback(() => {
    const version = ++loadVersion.current;
    return timetableService.layThoiKhoaBieu(semester).then((res) => {
      if (version !== loadVersion.current) return;
      setLoadError('');
      setDanhSach(res.data.thoiKhoaBieu || []);
    }).catch((error) => {
      if (version !== loadVersion.current) return;
      console.error(error);
      setLoadError('Không thể tải thời khóa biểu. Vui lòng kiểm tra kết nối mạng.');
    }).finally(() => {
      if (version === loadVersion.current) setDangTai(false);
    });
  }, [semester]);

  useEffect(() => {
    const counter = loadVersion;
    taiDuLieu();
    return () => { counter.current++; };
  }, [taiDuLieu]);

  function moFormThem() {
    setClassSemester(semester);
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
    setClassSemester(bh.hocKy || '');
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
    if (saveLock.current) return;
    if (gioSangPhut(gioKetThuc) <= gioSangPhut(gioBatDau)) {
      hienToast('error', 'Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }
    saveLock.current = true;
    setSaving(true);
    try {
      const data = { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien, hocKy: classSemester };
      if (dangSuaId) {
        await timetableService.suaBuoiHoc(dangSuaId, data);
        hienToast('success', 'Cập nhật buổi học thành công!');
      } else {
        await timetableService.themBuoiHoc(data);
        hienToast('success', 'Thêm buổi học mới thành công!');
      }
      setHienForm(false);
      taiDuLieu();
    } catch (error) {
      hienToast('error', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function yeuCauXoa(bh) {
    const thuHoc = CAC_THU.find((t) => t.gia === bh.thu)?.ten || '';
    setModalXacNhan({
      isOpen: true,
      title: 'Xóa buổi học?',
      subTitle: 'Hành động này sẽ xóa buổi học khỏi thời khóa biểu của bạn.',
      itemInfo: {
        label: bh.tenMon,
        value: `${thuHoc} • ${bh.gioBatDau} - ${bh.gioKetThuc}${bh.phongHoc ? ` • Phòng ${bh.phongHoc}` : ''}`,
      },
      message: 'Bạn có chắc chắn muốn xóa buổi học này không? Dữ liệu đã xóa không thể hoàn tác.',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      isLoading: false,
      onConfirm: () => thucHienXoa(bh.id),
    });
  }

  async function thucHienXoa(id) {
    setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
    try {
      await timetableService.xoaBuoiHoc(id);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', 'Đã xóa buổi học thành công!');
      taiDuLieu();
    } catch (error) {
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Xóa buổi học thất bại');
    }
  }

  const buoiTheoThu = useMemo(() => {
    return CAC_THU.reduce((map, t) => {
      map[t.gia] = danhSach
        .filter((bh) => bh.thu === t.gia)
        .sort((a, b) => gioSangPhut(a.gioBatDau) - gioSangPhut(b.gioBatDau));
      return map;
    }, {});
  }, [danhSach]);

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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setHienModalShare(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4 text-ink-600 dark:text-ink-400" />
              Chia sẻ TKB
            </button>
            <button
              onClick={moFormThem}
              aria-expanded={hienForm}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                hienForm
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-ink-600 dark:bg-ink-500 text-white hover:bg-ink-700 dark:hover:bg-ink-400 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienForm ? 'Hủy' : 'Thêm buổi học'}
            </button>
          </div>
        </div>

        {semester && danhSach.some((item) => !item.hocKy) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Lịch cũ chưa xếp học kỳ vẫn được hiển thị. Sửa buổi học để gắn vào học kỳ phù hợp.</p>}
        <ImportPanel kind="timetable" onImported={taiDuLieu} />
        {/* Form thêm mới */}
        <TimetableForm
          hocKy={classSemester}
          onHocKyChange={setClassSemester}
          hienForm={hienForm}
          dangSuaId={dangSuaId}
          tenMon={tenMon}
          thu={thu}
          gioBatDau={gioBatDau}
          gioKetThuc={gioKetThuc}
          phongHoc={phongHoc}
          giangVien={giangVien}
          onTenMonChange={setTenMon}
          onThuChange={setThu}
          onGioBatDauChange={setGioBatDau}
          onGioKetThucChange={setGioKetThuc}
          onPhongHocChange={setPhongHoc}
          onGiangVienChange={setGiangVien}
          onSubmit={xuLySubmit}
          saving={saving}
          onCancel={moFormThem}
        />

        {loadError ? <DataLoadError message={loadError} onRetry={taiDuLieu} /> : dangTai ? (
          <PageSkeleton />
        ) : soMonHoc === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">
              Lịch học trống
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Bạn chưa có buổi học nào. Hãy bắt đầu thêm các môn học vào thời khóa biểu nhé.
            </p>
            <button
              onClick={moFormThem}
              className="mt-6 flex items-center gap-2 bg-ink-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-ink-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm buổi học
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <TimetableGrid buoiTheoThu={buoiTheoThu} onSua={moFormSua} onXoa={yeuCauXoa} />
            <TimetableMobile buoiTheoThu={buoiTheoThu} onSua={moFormSua} onXoa={yeuCauXoa} />
          </div>
        )}
      </div>

      {/* Modal chia sẻ TKB */}
      {hienModalShare && <TimetableShareModal
        isOpen={hienModalShare}
        onClose={() => setHienModalShare(false)}
      />}

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

export default ThoiKhoaBieu;
