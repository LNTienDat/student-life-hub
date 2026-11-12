import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import SemesterPicker from '../components/SemesterPicker';
import useSessionDraft from '../hooks/useSessionDraft';
import DataLoadError from '../components/DataLoadError';
import useDataRevision from '../hooks/useDataRevision';
import ImportPanel from '../components/ImportPanel';
import { useCurrentSemester } from '../context/SemesterContext';
import { useSemester } from '../hooks/useSemester';
import { useState, useEffect, useRef, useCallback } from 'react';
import academicService from '../services/academicService';
import { clearCache } from '../services/apiCache';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { BookOpen, Plus, X, Target, Download } from 'lucide-react';

import SubjectGpaChart from './monhoc/SubjectGpaChart';
import SubjectForm from './monhoc/SubjectForm';
import SubjectCard from './monhoc/SubjectCard';
import { PageSkeleton } from '../components/Skeleton';

function MonHoc() {
  useLanguage();
  const [semester] = useSemester();
  const { currentSemester } = useCurrentSemester();
  const [danhSach, setDanhSach] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [gpaHe4, setGpaHe4] = useState(null);
  const [gpaTheoKy, setGpaTheoKy] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const externalRevision = useDataRevision({ externalOnly: true });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [hienFormThem, setHienFormThem] = useSessionDraft('MonHoc.jsx:hienFormThem', false);
  const [dangSuaId, setDangSuaId] = useSessionDraft('MonHoc.jsx:dangSuaId', null);

  const [monThemDiemId, setMonThemDiemId] = useSessionDraft('MonHoc.jsx:monThemDiemId', null);
  const [dangSuaDiemId, setDangSuaDiemId] = useSessionDraft('MonHoc.jsx:dangSuaDiemId', null);
  const [loaiDanhGia, setLoaiDanhGia] = useSessionDraft('MonHoc.jsx:loaiDanhGia', '');
  const [diemSo, setDiemSo] = useSessionDraft('MonHoc.jsx:diemSo', '');
  const [trongSo, setTrongSo] = useSessionDraft('MonHoc.jsx:trongSo', '');

  const [tenMon, setTenMon] = useSessionDraft('MonHoc.jsx:tenMon', '');
  const [tinChi, setTinChi] = useSessionDraft('MonHoc.jsx:tinChi', '');
  const [hocKy, setHocKy] = useSessionDraft('MonHoc.jsx:hocKy', '');

  // State modal xác nhận hiện đại
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
  const [dangXuatPDF, setDangXuatPDF] = useState(false);

  const loadVersion = useRef(0);
  const taiDuLieu = useCallback(() => {
    const version = ++loadVersion.current;
    return Promise.all([
        academicService.layDanhSachMonHoc(semester),
        academicService.tinhGPA(semester),
        academicService.gpaTheoKy(),
    ]).then(([resMonHoc, resGpa, resGpaKy]) => {
      if (version !== loadVersion.current) return;
      setLoadError('');
      setDanhSach(resMonHoc.data.monHocs || []);
      setGpa(resGpa.data.hasGrades === false ? null : resGpa.data.gpa);
      setGpaHe4(resGpa.data.hasGrades === false ? null : resGpa.data.gpaHe4);
      setGpaTheoKy(resGpaKy.data.theoKy || []);
    }).catch((error) => {
      if (version === loadVersion.current) setLoadError(error.response?.data?.message || 'Chưa tải được dữ liệu. Kiểm tra kết nối và thử lại.');
    }).finally(() => {
      if (version === loadVersion.current) setDangTai(false);
    });
  }, [semester]);

  useEffect(() => {
    const counter = loadVersion;
    taiDuLieu();
    return () => { counter.current++; };
  }, [taiDuLieu, externalRevision]);

  function moFormSua(mon) {
    if (saveLock.current) return;
    setTenMon(mon.ten);
    setTinChi(mon.tinChi);
    setHocKy(mon.hocKy);
    setDangSuaId(mon.id);
    setHienFormThem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moFormThem() {
    if (saveLock.current) return;
    setTenMon('');
    setTinChi('');
    setHocKy(semester || currentSemester);
    setDangSuaId(null);
    setHienFormThem(!hienFormThem);
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      if (dangSuaId) {
        await academicService.suaMonHoc(dangSuaId, { ten: tenMon, tinChi: Number(tinChi), hocKy });
        hienToast('success', `Đã cập nhật môn "${tenMon}" thành công!`);
      } else {
        await academicService.themMonHoc({ ten: tenMon, tinChi: Number(tinChi), hocKy });
        hienToast('success', `Đã thêm môn "${tenMon}" thành công!`);
      }
      clearCache('dashboard_cache');
      setHienFormThem(false);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function yeuCauXoaMon(mon) {
    setModalXacNhan({
      isOpen: true,
      title: 'Xác nhận xóa môn học',
      subTitle: mon.ten,
      itemInfo: {
        label: mon.ten,
        value: `${mon.tinChi} tín chỉ`,
        extra: mon.hocKy || 'Chưa xếp kỳ',
      },
      message: 'Bạn có chắc muốn xóa môn học này không? Toàn bộ dữ liệu điểm số của môn sẽ bị mất vĩnh viễn.',
      confirmText: 'Xác nhận xóa môn',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      onConfirm: () => thucHienXoaMon(mon.id, mon.ten),
    });
  }

  async function thucHienXoaMon(id, tenMonXoa) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    try {
      setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
      await academicService.xoaMonHoc(id);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', `Đã xóa môn "${tenMonXoa}" thành công!`);
      clearCache('dashboard_cache');
      taiDuLieu();
    } catch (error) {
      console.error(error);
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Không thể xóa môn học! Hãy thử lại.');
    } finally { saveLock.current = false; setSaving(false); }
  }

  function moFormThemDiem(monId) {
    if (saveLock.current) return;
    if (monThemDiemId === monId && !dangSuaDiemId) {
      setMonThemDiemId(null);
    } else {
      setMonThemDiemId(monId);
    }
    setDangSuaDiemId(null);
    setLoaiDanhGia('');
    setDiemSo('');
    setTrongSo('');
  }

  function moFormSuaDiem(monId, diem) {
    if (saveLock.current) return;
    setMonThemDiemId(monId);
    setDangSuaDiemId(diem.id);
    setLoaiDanhGia(diem.loaiDanhGia);
    setDiemSo(diem.diem);
    setTrongSo(diem.trongSo);
  }

  async function xuLyLuuDiem(e, monId) {
    e.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      if (dangSuaDiemId) {
        await academicService.suaDiem(dangSuaDiemId, {
          loaiDanhGia,
          diem: parseFloat(diemSo),
          trongSo: parseFloat(trongSo),
        });
        hienToast('success', `Đã cập nhật điểm "${loaiDanhGia}" thành công!`);
      } else {
        await academicService.themDiem(monId, {
          loaiDanhGia,
          diem: parseFloat(diemSo),
          trongSo: parseFloat(trongSo),
        });
        hienToast('success', `Đã thêm cột điểm "${loaiDanhGia}" thành công!`);
      }
      clearCache('dashboard_cache');
      setMonThemDiemId(null);
      setDangSuaDiemId(null);
      taiDuLieu();
    } catch (error) {
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Không thể lưu điểm! Hãy kiểm tra lại dữ liệu.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function yeuCauXoaDiem(mon, diem) {
    setModalXacNhan({
      isOpen: true,
      title: 'Xác nhận xóa cột điểm',
      subTitle: `Môn: ${mon.ten}`,
      itemInfo: {
        label: diem.loaiDanhGia,
        value: `${diem.diem} điểm`,
        extra: `Trọng số ${diem.trongSo}%`,
      },
      message:
        'Bạn có chắc muốn xóa cột điểm này? Thao tác này sẽ tự động cập nhật lại điểm trung bình (GPA) của môn học.',
      confirmText: 'Xác nhận xóa điểm',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      onConfirm: () => thucHienXoaDiem(diem.id, diem.loaiDanhGia),
    });
  }

  async function thucHienXoaDiem(diemId, loaiDanhGiaXoa) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    try {
      setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
      await academicService.xoaDiem(diemId);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', `Đã xóa cột điểm "${loaiDanhGiaXoa}" thành công!`);
      clearCache('dashboard_cache');
      taiDuLieu();
    } catch (error) {
      console.error(error);
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Không thể xóa điểm! Hãy thử lại.');
    } finally { saveLock.current = false; setSaving(false); }
  }

  async function xuLyXuatBangDiem() {
    try {
      setDangXuatPDF(true);
      const res = await academicService.xuatBangDiemPDF(semester);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bang-diem.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      hienToast('success', 'Đã tải bảng điểm PDF thành công!');
    } catch (error) {
      console.error(error);
      hienToast('error', 'Không thể tải bảng điểm. Hãy thử lại!');
    } finally {
      setDangXuatPDF(false);
    }
  }

  return (
    <>
      <div className="w-full min-w-0 space-y-6 pb-12">
        {/* Header & Tiện ích */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{tr("Học tập")}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{tr("Quản lý tiến độ học tập và theo dõi GPA")}</p>
          </div>

          <SemesterPicker className="order-2 md:order-3 md:col-span-2" />

          <div className="order-3 md:order-2 grid grid-cols-2 items-stretch gap-2 md:flex md:flex-wrap md:items-center">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex min-h-11 justify-center items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">GPA {semester ? tr('học kỳ') : tr('tích lũy')}</span>
                <span className="font-display font-bold text-slate-900 dark:text-white leading-none">
                  {gpa !== null ? `${Number(gpa).toFixed(2)} / 10${gpaHe4 != null ? ` (${Number(gpaHe4).toFixed(2)} / 4)` : ''}` : '--'}
                </span>
              </div>
            </div>
            <button
              onClick={xuLyXuatBangDiem}
              disabled={dangXuatPDF || danhSach.length === 0}
              className="flex min-h-11 justify-center items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm"
              title={tr("Xuất bảng điểm PDF")}
              aria-label={tr("Xuất bảng điểm ra file PDF")}
            >
              <Download className="w-4 h-4" />
              <span className="inline">{dangXuatPDF ? tr('Đang xuất...') : tr('Xuất PDF')}</span>
            </button>
            <button
              onClick={moFormThem}
              className={`col-span-2 flex min-h-11 justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                hienFormThem
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]'
              }`}
            >
              {hienFormThem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienFormThem ? tr('Hủy') : tr('Thêm môn học')}
            </button>
          </div>
        </div>

        <ImportPanel kind="subjects" onImported={taiDuLieu} />
        {/* 1. Biểu đồ GPA theo kỳ */}
        <SubjectGpaChart gpaTheoKy={gpaTheoKy} />

        {/* 2. Form thêm/sửa môn học */}
        <SubjectForm
          hienFormThem={hienFormThem}
          dangSuaId={dangSuaId}
          tenMon={tenMon}
          tinChi={tinChi}
          hocKy={hocKy}
          onTenMonChange={setTenMon}
          onTinChiChange={setTinChi}
          onHocKyChange={setHocKy}
          onSubmit={xuLySubmit}
          saving={saving}
        />

        {/* 3. Danh sách môn học */}
        {loadError ? <DataLoadError message={loadError} onRetry={taiDuLieu} /> : dangTai ? (
          <PageSkeleton />
        ) : danhSach.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">{tr("Chưa có môn học nào")}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{tr("Hãy thêm môn học đầu tiên để bắt đầu theo dõi tiến độ và điểm số của bạn.")}</p>
            <button
              onClick={moFormThem}
              className="mt-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />{tr(" Thêm môn học")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {danhSach.map((mon) => (
              <SubjectCard
                key={mon.id}
                mon={mon}
                monThemDiemId={monThemDiemId}
                dangSuaDiemId={dangSuaDiemId}
                loaiDanhGia={loaiDanhGia}
                diemSo={diemSo}
                trongSo={trongSo}
                onOpenAddGrade={moFormThemDiem}
                onOpenEditGrade={moFormSuaDiem}
                onCloseGradeForm={() => {
                  setMonThemDiemId(null);
                  setDangSuaDiemId(null);
                }}
                onLoaiDanhGiaChange={setLoaiDanhGia}
                onDiemSoChange={setDiemSo}
                onTrongSoChange={setTrongSo}
                onSubmitGrade={xuLyLuuDiem}
                saving={saving}
                onDeleteGrade={yeuCauXoaDiem}
                onEditSubject={moFormSua}
                onDeleteSubject={yeuCauXoaMon}
              />
            ))}
          </div>
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

export default MonHoc;
