import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import SemesterPicker from '../components/SemesterPicker';
import useSessionDraft from '../hooks/useSessionDraft';
import TimetableAdjustmentModal from './thoikhoabieu/TimetableAdjustmentModal';
import {monday,addDays} from './thoikhoabieu/weekUtils';
import DataLoadError from '../components/DataLoadError';
import useDataRevision from '../hooks/useDataRevision';
import TimetableImageImport from '../components/TimetableImageImport';
import { useCurrentSemester } from '../context/SemesterContext';
import { useSemester } from '../hooks/useSemester';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import timetableService from '../services/timetableService';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { Plus, X, CalendarDays, CalendarRange, CalendarCheck, ChevronLeft, ChevronRight, Share2, Trash2, ImagePlus } from 'lucide-react';
import { CAC_THU, gioSangPhut } from './thoikhoabieu/timetableUtils';

import TimetableForm from './thoikhoabieu/TimetableForm';
import TimetableGrid from './thoikhoabieu/TimetableGrid';
import TimetableMobile from './thoikhoabieu/TimetableMobile';
import TimetableShareModal from './thoikhoabieu/TimetableShareModal';
import { PageSkeleton } from '../components/Skeleton';

function ThoiKhoaBieu() {
  useLanguage();
  const [semester] = useSemester();
  const [imagePickerOpen,setImagePickerOpen] = useState(false);
  const [week,setWeek]=useState(()=>monday());
  const [adjusting,setAdjusting]=useState(null);
  const [adjustments,setAdjustments]=useState([]);
  const { currentSemester } = useCurrentSemester();
  const [classSemester, setClassSemester] = useSessionDraft('ThoiKhoaBieu.jsx:classSemester', semester);
  const [danhSach, setDanhSach] = useState([]);
  const [baseList,setBaseList]=useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loadedSemester, setLoadedSemester] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [importVersion, setImportVersion] = useState(0);
  const externalRevision = useDataRevision({ externalOnly: true });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [hienForm, setHienForm] = useSessionDraft('ThoiKhoaBieu.jsx:hienForm', false);
  const [dangSuaId, setDangSuaId] = useSessionDraft('ThoiKhoaBieu.jsx:dangSuaId', null);
  const [hienModalShare, setHienModalShare] = useState(false);

  const [tenMon, setTenMon] = useSessionDraft('ThoiKhoaBieu.jsx:tenMon', '');
  const [thu, setThu] = useSessionDraft('ThoiKhoaBieu.jsx:thu', 2);
  const [gioBatDau, setGioBatDau] = useSessionDraft('ThoiKhoaBieu.jsx:gioBatDau', '07:00');
  const [gioKetThuc, setGioKetThuc] = useSessionDraft('ThoiKhoaBieu.jsx:gioKetThuc', '09:00');
  const [phongHoc, setPhongHoc] = useSessionDraft('ThoiKhoaBieu.jsx:phongHoc', '');
  const [giangVien, setGiangVien] = useSessionDraft('ThoiKhoaBieu.jsx:giangVien', '');

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
    return timetableService.layThoiKhoaBieu(semester,week).then((res) => {
      if (version !== loadVersion.current) return;
      setLoadError('');
      setDanhSach(res.data.thoiKhoaBieu || []);
      setAdjustments(res.data.dieuChinhs||[]);
      setBaseList(res.data.lichLap||res.data.thoiKhoaBieu||[]);
    }).catch((error) => {
      if (version !== loadVersion.current) return;
      console.error(error);
      setLoadError('Không thể tải thời khóa biểu. Vui lòng kiểm tra kết nối mạng.');
    }).finally(() => {
      if (version === loadVersion.current) { setDangTai(false); setLoadedSemester(semester+':'+week); }
    });
  }, [semester,week]);

  useEffect(() => {
    const counter = loadVersion;
    taiDuLieu();
    return () => { counter.current++; };
  }, [taiDuLieu, externalRevision, refreshVersion]);

  function moFormThem() {
    if (saveLock.current) return;
    setClassSemester(semester || currentSemester);
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
    if (saveLock.current) return;
    bh=baseList.find(item=>item.id===bh.id)||bh;
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
      subTitle: 'Xóa lịch lặp ở tất cả các tuần và các điều chỉnh riêng của buổi này.',
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
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
    try {
      await timetableService.xoaBuoiHoc(id);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', 'Đã xóa buổi học thành công!');
      taiDuLieu();
    } catch (error) {
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Xóa buổi học thất bại');
    } finally { saveLock.current = false; setSaving(false); }
  }


  function yeuCauXoaLich() {
    if (saveLock.current || dangTai || loadedSemester !== semester+':'+week || loadError || !baseList.length) return;
    const ids = [...new Set(baseList.map(item => item.id))];
    const scope = semester ? 'Lịch lặp của học kỳ ' + semester : 'Lịch lặp của tất cả học kỳ đang xem';
    const shared = semester && baseList.some(item => !item.hocKy);
    setModalXacNhan({
      isOpen: true,
      title: 'Xóa lịch hiện tại?',
      itemInfo: { label: scope, value: ids.length + ' buổi học' },
      message: 'Sẽ xóa ' + ids.length + ' lịch lặp trong phạm vi này ở tất cả các tuần, cùng các điều chỉnh riêng.' +
        (shared ? ' Bao gồm lịch cũ chưa gắn học kỳ đang được hiển thị chung.' : '') +
        ' Dữ liệu đã xóa không thể hoàn tác.',
      confirmText: 'Xóa ' + ids.length + ' buổi học',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        if (saveLock.current) return;
        saveLock.current = true;
        setSaving(true);
        setModalXacNhan(previous => ({ ...previous, isLoading: true }));
        try {
          const { data } = await timetableService.xoaNhieuBuoiHoc(ids);
          setModalXacNhan(previous => ({ ...previous, isOpen: false, isLoading: false }));
          setDanhSach(previous => previous.filter(item => !ids.includes(item.id)));
          if (ids.includes(dangSuaId)) { setHienForm(false); setDangSuaId(null); }
          setImportVersion(value => value + 1);
          setRefreshVersion(value => value + 1);
          hienToast('success', 'Đã xóa ' + data.count + ' buổi học.');
        } catch (error) {
          setModalXacNhan(previous => ({ ...previous, isLoading: false }));
          setRefreshVersion(value => value + 1);
          hienToast('error', error.response?.data?.message || 'Chưa xóa được lịch học. Hãy thử lại.');
        } finally {
          saveLock.current = false;
          setSaving(false);
        }
      },
    });
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
      <div className="w-full min-w-0 space-y-6 pb-12">
        {/* Header */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{tr("Lịch học")}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{tr("Bạn có ")}{soMonHoc}{tr(" buổi học trong tuần này")}</p>
          </div>

          <SemesterPicker className="order-2 md:order-3 md:col-span-2" />

          <div className="order-3 md:order-2 grid w-full grid-cols-2 items-stretch gap-2.5 md:flex md:w-auto md:flex-wrap">
            <button type="button" onClick={yeuCauXoaLich}
              disabled={saving || dangTai || loadedSemester !== semester+':'+week || !!loadError || !baseList.length || baseList.length > 1000}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30">
              <Trash2 className="h-4 w-4" aria-hidden="true" />{tr("Xóa lịch hiện tại")}</button>
            <button
              onClick={() => setHienModalShare(true)}
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4 text-ink-600 dark:text-ink-400" />{tr("Chia sẻ TKB")}</button>
            <button type="button" onClick={()=>setImagePickerOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-800"><ImagePlus className="h-4 w-4"/>{tr("Nhập ảnh")}</button>
            <button
              onClick={moFormThem}
              aria-expanded={hienForm}
              className={`flex min-h-11 items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                hienForm
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-ink-600 dark:bg-ink-500 text-white hover:bg-ink-700 dark:hover:bg-ink-400 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienForm ? tr('Hủy') : tr('Thêm buổi học')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2 sm:flex">
          <button type="button" disabled={saving} aria-label={tr("Tuần trước")} title={tr("Tuần trước")} onClick={() => setWeek(addDays(week, -7))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border dark:border-slate-600"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
          <label title={tr("Chọn tuần bắt đầu")} className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-xl border bg-white px-2 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CalendarRange aria-hidden="true" className="hidden h-5 w-5 shrink-0 sm:block" />
            <input type="date" min="1000-01-01" max="9999-12-24" aria-label={tr("Tuần bắt đầu")} value={week} onChange={e => { if (e.target.value) setWeek(monday(e.target.value)); }} className="min-h-11 w-full min-w-0 bg-transparent text-sm sm:w-auto" />
          </label>
          <button type="button" disabled={saving} aria-label={tr("Tuần sau")} title={tr("Tuần sau")} onClick={() => setWeek(addDays(week, 7))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border dark:border-slate-600"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" disabled={saving} aria-label={tr("Về tuần hiện tại")} title={tr("Về tuần hiện tại")} onClick={() => setWeek(monday())} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-ink-600 hover:bg-ink-50 dark:border-slate-600 dark:text-ink-200 dark:hover:bg-slate-700"><CalendarCheck aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        {!!adjustments.length&&<details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><summary className="min-h-11 cursor-pointer py-2 font-medium">{tr("Điều chỉnh trong tuần (")}{adjustments.length})</summary>{adjustments.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 dark:border-slate-700"><span className="min-w-0 break-words">{item.tenMon}{tr(" · ")}{item.ngayGoc}{tr(" · ")}{item.loai==='nghi'?tr('Nghỉ'):(tr('Đổi sang ')+item.ngayMoi+' '+item.gioBatDau+'–'+item.gioKetThuc)}</span><button type="button" disabled={saving} onClick={async()=>{if(saveLock.current)return;saveLock.current=true;setSaving(true);try{await timetableService.xoaDieuChinh(item.id);setRefreshVersion(n=>n+1);hienToast('success','Đã hoàn tác điều chỉnh.');}catch(e){hienToast('error',e.response?.data?.message||'Chưa hoàn tác được.');}finally{saveLock.current=false;setSaving(false);}}} className="min-h-11 shrink-0 px-3 text-ink-600">{tr("Hoàn tác điều chỉnh")}</button></div>)}</details>}
        {semester && danhSach.some((item) => !item.hocKy) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{tr("Lịch cũ chưa xếp học kỳ vẫn được hiển thị. Sửa buổi học để gắn vào học kỳ phù hợp.")}</p>}
        <TimetableImageImport key={(semester || currentSemester) + ':' + importVersion} semester={semester || currentSemester} onImported={taiDuLieu} pickerOpen={imagePickerOpen} onPickerClose={()=>setImagePickerOpen(false)} />
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

        {loadError ? <DataLoadError message={loadError} onRetry={taiDuLieu} /> : dangTai || loadedSemester !== semester+':'+week ? (
          <PageSkeleton />
        ) : soMonHoc === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200">
              {baseList.length?tr('Tuần này không có buổi học'):tr('Lịch học trống')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {baseList.length?tr('Các buổi trong tuần đã được điều chỉnh. Bạn có thể xem tuần khác hoặc hoàn tác điều chỉnh.'):tr('Thêm lịch lặp hoặc nhập thời khóa biểu từ ảnh để bắt đầu.')}
            </p>
            <button
              onClick={moFormThem}
              className="mt-6 flex items-center gap-2 bg-ink-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-ink-700 transition-colors"
            >
              <Plus className="w-4 h-4" />{tr(" Thêm buổi học")}</button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <TimetableGrid buoiTheoThu={buoiTheoThu} onSua={moFormSua} onXoa={yeuCauXoa} onDieuChinh={setAdjusting} disabled={saving} />
            <TimetableMobile buoiTheoThu={buoiTheoThu} onSua={moFormSua} onXoa={yeuCauXoa} onDieuChinh={setAdjusting} disabled={saving} />
          </div>
        )}
      </div>

      {adjusting&&<TimetableAdjustmentModal key={adjusting.occurrenceId} item={adjusting} onClose={()=>setAdjusting(null)} onSaved={()=>setRefreshVersion(n=>n+1)}/>}
      {/* Modal chia sẻ TKB */}
      {hienModalShare && <TimetableShareModal
        semester={semester || currentSemester}
        isOpen={hienModalShare}
        onClose={() => setHienModalShare(false)}
      />}

      {/* Modal xác nhận xóa hiện đại */}
      <ConfirmModal
        isOpen={modalXacNhan.isOpen}
        onClose={() => { if (!modalXacNhan.isLoading) setModalXacNhan((prev) => ({ ...prev, isOpen: false })); }}
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
