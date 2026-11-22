import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import SemesterPicker from '../components/SemesterPicker';
import useSessionDraft from '../hooks/useSessionDraft';
import DataLoadError from '../components/DataLoadError';
import useDataRevision from '../hooks/useDataRevision';
import ImportPanel from '../components/ImportPanel';
import TranscriptImportModal from '../components/TranscriptImportModal';
import SyncSubjectsFromTimetableModal from '../components/SyncSubjectsFromTimetableModal';
import GradePredictorModal from '../components/GradePredictorModal';
import { useCurrentSemester } from '../context/SemesterContext';
import { useSemester } from '../hooks/useSemester';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import academicService from '../services/academicService';
import { clearCache } from '../services/apiCache';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { BookOpen, Plus, Target, Download, Camera, CalendarSync, FileSpreadsheet, SlidersHorizontal } from 'lucide-react';
import {
  GRADE_SCALE_PRESETS,
  loadGradePrefs,
  saveGradePrefs,
  calcOverallGpa,
  classifyGpa4,
} from '../utils/gradeScale';

import SubjectGpaChart from './monhoc/SubjectGpaChart';
import SubjectForm from './monhoc/SubjectForm';
import SubjectCard from './monhoc/SubjectCard';
import { PageSkeleton } from '../components/Skeleton';

function MonHoc() {
  useLanguage();
  const [semester] = useSemester();
  const { currentSemester } = useCurrentSemester();
  const [gradePrefs, setGradePrefs] = useState(loadGradePrefs);
  const [danhSach, setDanhSach] = useState([]);
  const [gpaTheoKy, setGpaTheoKy] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const externalRevision = useDataRevision({ externalOnly: true });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  const [hienFormThem, setHienFormThem] = useSessionDraft('MonHoc.jsx:hienFormThem', false);
  const [dangSuaId, setDangSuaId] = useSessionDraft('MonHoc.jsx:dangSuaId', null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [syncTimetableOpen, setSyncTimetableOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [predictSubject, setPredictSubject] = useState(null);

  const [monThemDiemId, setMonThemDiemId] = useSessionDraft('MonHoc.jsx:monThemDiemId', null);
  const [dangSuaDiemId, setDangSuaDiemId] = useSessionDraft('MonHoc.jsx:dangSuaDiemId', null);
  const [loaiDanhGia, setLoaiDanhGia] = useSessionDraft('MonHoc.jsx:loaiDanhGia', '');
  const [diemSo, setDiemSo] = useSessionDraft('MonHoc.jsx:diemSo', '');
  const [trongSo, setTrongSo] = useSessionDraft('MonHoc.jsx:trongSo', '');

  const [tenMon, setTenMon] = useSessionDraft('MonHoc.jsx:tenMon', '');
  const [tinChi, setTinChi] = useSessionDraft('MonHoc.jsx:tinChi', '');
  const [hocKy, setHocKy] = useSessionDraft('MonHoc.jsx:hocKy', '');

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

  function updateGradePrefs(patch) {
    setGradePrefs((prev) => {
      const next = { ...prev, ...patch };
      saveGradePrefs(next);
      return next;
    });
  }

  const loadVersion = useRef(0);
  const taiDuLieu = useCallback(() => {
    const version = ++loadVersion.current;
    return Promise.all([
      academicService.layDanhSachMonHoc(semester),
      academicService.gpaTheoKy(gradePrefs.scaleId),
    ]).then(([resMonHoc, resGpaKy]) => {
      if (version !== loadVersion.current) return;
      setLoadError('');
      setDanhSach(resMonHoc.data.monHocs || []);
      setGpaTheoKy(resGpaKy.data.theoKy || []);
    }).catch((error) => {
      if (version === loadVersion.current) {
        setLoadError(error.response?.data?.message || 'Chưa tải được dữ liệu. Kiểm tra kết nối và thử lại.');
      }
    }).finally(() => {
      if (version === loadVersion.current) setDangTai(false);
    });
  }, [semester, gradePrefs.scaleId]);

  useEffect(() => {
    const counter = loadVersion;
    taiDuLieu();
    return () => { counter.current++; };
  }, [taiDuLieu, externalRevision]);

  const overview = useMemo(
    () => calcOverallGpa(danhSach, gradePrefs.scaleId),
    [danhSach, gradePrefs.scaleId]
  );

  function dongForm() {
    if (saveLock.current) return;
    setHienFormThem(false);
    setDangSuaId(null);
  }

  function moFormSua(mon) {
    if (saveLock.current) return;
    setTenMon(mon.ten);
    setTinChi(mon.tinChi);
    setHocKy(mon.hocKy);
    setDangSuaId(mon.id);
    setHienFormThem(true);
  }

  function moFormThem() {
    if (saveLock.current) return;
    setTenMon('');
    setTinChi('');
    setHocKy(semester || currentSemester);
    setDangSuaId(null);
    setHienFormThem(true);
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
      setDangSuaId(null);
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
    saveLock.current = true;
    setSaving(true);
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
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
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

  async function xuLyLuuDiem(e, monId, convertedScore10) {
    e.preventDefault();
    if (saveLock.current) return;
    const scoreValue = Number.isFinite(convertedScore10) ? convertedScore10 : parseFloat(diemSo);
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 10) {
      hienToast('error', 'Giá trị điểm không hợp lệ.');
      return;
    }
    saveLock.current = true;
    setSaving(true);
    try {
      if (dangSuaDiemId) {
        await academicService.suaDiem(dangSuaDiemId, {
          loaiDanhGia,
          diem: scoreValue,
          trongSo: parseFloat(trongSo),
        });
        hienToast('success', `Đã cập nhật điểm "${loaiDanhGia}" thành công!`);
      } else {
        await academicService.themDiem(monId, {
          loaiDanhGia,
          diem: scoreValue,
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
    saveLock.current = true;
    setSaving(true);
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
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
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

  const gpaDisplayText = !overview.hasGrades
    ? '--'
    : gradePrefs.displayMode === '4'
      ? `${overview.gpa4.toFixed(2)} / 4`
      : gradePrefs.displayMode === '10'
        ? `${overview.gpa10.toFixed(2)} / 10`
        : `${overview.gpa10.toFixed(2)} / 10 (${overview.gpa4.toFixed(2)} / 4)`;

  return (
    <>
      <div className="w-full min-w-0 space-y-5 pb-12">
        {/* Header & Tiện ích */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{tr("Học tập")}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{tr("Quản lý tiến độ học tập, nhập bảng điểm từ ảnh và theo dõi GPA hệ 10 / hệ 4")}</p>
          </div>

          <SemesterPicker className="order-2 md:order-3 md:col-span-2" />

          <div className="order-3 md:order-2 grid grid-cols-2 items-stretch gap-2 md:flex md:flex-wrap md:items-center">
            <button
              type="button"
              onClick={() => setTranscriptOpen(true)}
              className="flex min-h-11 justify-center items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 whitespace-nowrap transition-colors"
            >
              <Camera className="h-4 w-4 shrink-0" />{tr("Quét bảng điểm")}
            </button>
            <button
              type="button"
              onClick={() => setSyncTimetableOpen(true)}
              className="flex min-h-11 justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
            >
              <CalendarSync className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />{tr("Từ Lịch học")}
            </button>
            <button
              type="button"
              onClick={() => setCsvOpen((prev) => !prev)}
              aria-expanded={csvOpen}
              className="flex min-h-11 justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />{tr("Excel / CSV")}
            </button>
            <button
              type="button"
              onClick={xuLyXuatBangDiem}
              disabled={dangXuatPDF || danhSach.length === 0}
              className="flex min-h-11 justify-center items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
              title={tr("Xuất bảng điểm PDF")}
              aria-label={tr("Xuất bảng điểm ra file PDF")}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{dangXuatPDF ? tr('Đang xuất...') : tr('Xuất PDF')}</span>
            </button>
            <button
              type="button"
              onClick={moFormThem}
              className="col-span-2 md:col-auto flex min-h-11 justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 shrink-0" />
              {tr('Thêm môn học')}
            </button>
          </div>
        </div>

        {/* Thanh tổng quan GPA + chọn thang điểm trường */}
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">GPA {semester ? tr('học kỳ') : tr('tích lũy')}</p>
                <p className="font-display text-base font-bold text-slate-900 dark:text-white truncate">{gpaDisplayText}</p>
                {overview.hasGrades && (
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {tr("Xếp loại:")} {tr(classifyGpa4(overview.gpa4))}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr("Tín chỉ đã có điểm")}</p>
              <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                {overview.gradedCredits} / {overview.totalCredits} TC
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {danhSach.length} {tr("môn học")}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr("Tình trạng môn")}</p>
              <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                {overview.passedCount} {tr("đạt")}
                {overview.riskCount > 0 && (
                  <span className="ml-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                    · {overview.riskCount} {tr("cần chú ý")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3 dark:border-slate-700 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <select
              aria-label={tr("Quy chuẩn quy đổi điểm")}
              value={gradePrefs.scaleId}
              onChange={(e) => updateGradePrefs({ scaleId: e.target.value })}
              className="min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {Object.values(GRADE_SCALE_PRESETS).map((preset) => (
                <option key={preset.id} value={preset.id}>{tr(preset.shortLabel)}</option>
              ))}
            </select>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-slate-600 dark:bg-slate-900">
              {[
                { id: 'both', label: '10 & 4' },
                { id: '4', label: 'Thang 4' },
                { id: '10', label: 'Thang 10' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateGradePrefs({ displayMode: m.id })}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${gradePrefs.displayMode === m.id ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                >
                  {tr(m.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {csvOpen && <ImportPanel kind="subjects" onImported={taiDuLieu} />}

        {/* Biểu đồ GPA theo kỳ */}
        <SubjectGpaChart gpaTheoKy={gpaTheoKy} displayMode={gradePrefs.displayMode} />

        {/* Popup thêm/sửa môn học */}
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
          onCancel={dongForm}
          saving={saving}
        />

        {/* Danh sách môn học */}
        {loadError ? <DataLoadError message={loadError} onRetry={taiDuLieu} /> : dangTai ? (
          <PageSkeleton />
        ) : danhSach.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">{tr("Chưa có môn học nào")}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              {tr("Bạn có thể chụp ảnh bảng điểm bằng AI Vision, kéo môn từ Lịch học sang, hoặc tự thêm môn học đầu tiên.")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setTranscriptOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
              >
                <Camera className="w-4 h-4" />{tr("Quét bảng điểm")}
              </button>
              <button
                type="button"
                onClick={() => setSyncTimetableOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <CalendarSync className="w-4 h-4 text-sky-600" />{tr("Lấy từ Lịch học")}
              </button>
              <button
                type="button"
                onClick={moFormThem}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />{tr("Thêm môn học")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {danhSach.map((mon) => (
              <SubjectCard
                key={mon.id}
                mon={mon}
                scaleId={gradePrefs.scaleId}
                displayMode={gradePrefs.displayMode}
                defaultInputScale={gradePrefs.displayMode === '4' ? '4' : '10'}
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
                onOpenPredict={setPredictSubject}
                saving={saving}
                onDeleteGrade={yeuCauXoaDiem}
                onEditSubject={moFormSua}
                onDeleteSubject={yeuCauXoaMon}
              />
            ))}
          </div>
        )}
      </div>

      {transcriptOpen && (
        <TranscriptImportModal
          open={transcriptOpen}
          onClose={() => setTranscriptOpen(false)}
          defaultSemester={semester || currentSemester}
          scaleId={gradePrefs.scaleId}
          existingSubjects={danhSach}
          onImported={() => { clearCache('dashboard_cache'); taiDuLieu(); }}
        />
      )}

      {syncTimetableOpen && (
        <SyncSubjectsFromTimetableModal
          open={syncTimetableOpen}
          onClose={() => setSyncTimetableOpen(false)}
          semester={semester}
          currentSemester={currentSemester}
          existingSubjects={danhSach}
          onImported={() => { clearCache('dashboard_cache'); taiDuLieu(); }}
        />
      )}

      {predictSubject && (
        <GradePredictorModal
          mon={predictSubject}
          open={Boolean(predictSubject)}
          onClose={() => setPredictSubject(null)}
          scaleId={gradePrefs.scaleId}
        />
      )}

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
