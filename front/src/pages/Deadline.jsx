import useSessionDraft from '../hooks/useSessionDraft';
import DataLoadError from '../components/DataLoadError';
import useDataRevision from '../hooks/useDataRevision';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import deadlineService from '../services/deadlineService';
import { clearCache } from '../services/apiCache';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { formatDeadlineDate, deadlineToISO, deadlineInputValue, defaultDeadlineDate } from './deadline/deadlineDate';
import { Calendar as CalendarIcon, List, Plus, X } from 'lucide-react';

import DeadlineForm from './deadline/DeadlineForm';
import { DEADLINE_PRIORITIES, selectDeadlines } from './deadline/deadlineUtils';
import DeadlineCalendarView from './deadline/DeadlineCalendarView';
import DeadlineListView from './deadline/DeadlineListView';
import triggerConfetti from '../utils/confetti';
import { PageSkeleton } from '../components/Skeleton';

function Deadline() {
  const [danhSach, setDanhSach] = useState([]);
  const [daXoa, setDaXoa] = useState([]);
  const [tuDongXoa, setTuDongXoa] = useState(false);
  const [mucQuanTrongLoc, setMucQuanTrongLoc] = useState('all');
  const [dangTai, setDangTai] = useState(true);
  const externalRevision = useDataRevision({ externalOnly: true });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [hienFormThem, setHienFormThem] = useSessionDraft('Deadline.jsx:hienFormThem', false);
  const [dangSuaId, setDangSuaId] = useSessionDraft('Deadline.jsx:dangSuaId', null);
  const [cheDoXem, setCheDoXem] = useState('list'); // 'list' | 'calendar'

  // Calendar state
  const [thangXemLich, setThangXemLich] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [ngayDuocChon, setNgayDuocChon] = useState(null);

  // Form state
  const [tieuDe, setTieuDe] = useSessionDraft('Deadline.jsx:tieuDe', '');
  const [hanChot, setHanChot] = useSessionDraft('Deadline.jsx:hanChot', '');
  const [doUuTien, setDoUuTien] = useSessionDraft('Deadline.jsx:doUuTien', 'binh_thuong');

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

  const loadVersion = useRef(0);
  const taiDuLieu = useCallback(() => {
    const version = ++loadVersion.current;
    return deadlineService.layDanhSachDeadline().then((resDeadline) => {
      if (version !== loadVersion.current) return;
      setLoadError('');
      setDanhSach(resDeadline.data.deadlines || []);
      setDaXoa(resDeadline.data.daXoa || []);
      setTuDongXoa(Boolean(resDeadline.data.tuDongXoaDeadline));
    }).catch((error) => {
      if (version === loadVersion.current) setLoadError(error.response?.data?.message || 'Chưa tải được dữ liệu. Kiểm tra kết nối và thử lại.');
    }).finally(() => {
      if (version === loadVersion.current) setDangTai(false);
    });
  }, []);

  useEffect(() => {
    const counter = loadVersion;
    taiDuLieu();
    return () => { counter.current++; };
  }, [taiDuLieu, externalRevision]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !saveLock.current) taiDuLieu(); };
    const timer = tuDongXoa ? setInterval(refresh, 30000) : null;
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [tuDongXoa, taiDuLieu]);

  async function luuTuyChon() {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    const previous = tuDongXoa;
    setTuDongXoa(!previous);
    try { await deadlineService.luuCaiDat(!previous); await taiDuLieu(); }
    catch (error) { setTuDongXoa(previous); hienToast('error', error.response?.data?.message || 'Chưa lưu được tùy chọn.'); }
    finally { saveLock.current = false; setSaving(false); }
  }

  async function khoiPhuc(item) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    try {
      await deadlineService.khoiPhuc(item.id); clearCache('dashboard_cache'); await taiDuLieu();
      hienToast('success', 'Đã khôi phục về chưa hoàn thành.');
    } catch (error) { hienToast('error', error.response?.data?.message || 'Chưa khôi phục được.'); }
    finally { saveLock.current = false; setSaving(false); }
  }

  function moFormThem() {
    if (saveLock.current) return;
    setTieuDe('');
    setHanChot(defaultDeadlineDate());
    setDoUuTien(mucQuanTrongLoc === 'all' ? 'binh_thuong' : mucQuanTrongLoc);
    setDangSuaId(null);
    setHienFormThem(!hienFormThem);
  }

  function moFormSua(d) {
    if (saveLock.current) return;
    setTieuDe(d.tieuDe);
    setHanChot(deadlineInputValue(d.hanChot));
    setDoUuTien(d.doUuTien);
    setDangSuaId(d.id);
    setHienFormThem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      const data = {
        tieuDe,
        hanChot: deadlineToISO(hanChot),
        doUuTien,
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
      hienToast('error', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function yeuCauXoa(d) {
    setModalXacNhan({
      isOpen: true,
      title: 'Xác nhận xóa deadline',
      subTitle: '',
      itemInfo: {
        label: d.tieuDe,
        value: formatDeadlineDate(d.hanChot),
        extra: d.doUuTien === 'cao' ? 'Khẩn cấp' : d.doUuTien === 'thap' ? 'Ưu tiên thấp' : 'Bình thường',
      },
      message: 'Bạn có chắc chắn muốn xóa deadline này không? Thao tác này không thể hoàn tác.',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      onConfirm: () => thucHienXoa(d.id),
    });
  }

  async function thucHienXoa(id) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
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
    } finally { saveLock.current = false; setSaving(false); }
  }

  async function xuLyHoanThanh(id, dangHoanThanh) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true);
    try {
      await deadlineService.suaDeadline(id, { trangThai: dangHoanThanh ? 'cho_xu_ly' : 'hoan_thanh' });
      if (!dangHoanThanh) {
        triggerConfetti();
      }
      hienToast(
        'success',
        dangHoanThanh ? 'Đã hoàn tác trạng thái deadline' : 'Chúc mừng bạn đã hoàn thành deadline! 🎉'
      );
      clearCache('dashboard_cache');
      taiDuLieu();
    } catch (error) {
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Không thể cập nhật trạng thái deadline');
    } finally { saveLock.current = false; setSaving(false); }
  }

  function doiThang(denta) {
    setThangXemLich(new Date(thangXemLich.getFullYear(), thangXemLich.getMonth() + denta, 1));
  }

  const danhSachLoc = useMemo(() => selectDeadlines(danhSach, mucQuanTrongLoc), [danhSach, mucQuanTrongLoc]);
  const tongChuaHoanThanh = danhSach.filter(d => d.trangThai !== 'hoan_thanh').length;
  const dangDienHanh = danhSachLoc.filter(d => d.trangThai !== 'hoan_thanh');
  const daHoanThanh = danhSachLoc.filter(d => d.trangThai === 'hoan_thanh');
  const tenMucLoc = DEADLINE_PRIORITIES.find(level => level.value === mucQuanTrongLoc)?.label;

  return (
    <>
      <div className="w-full min-w-0 space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản lý Deadline
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bạn có {tongChuaHoanThanh} công việc cần hoàn thành
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          <button type="button" aria-expanded={hienFormThem}
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
        </div>

        {/* Form thêm mới */}
        <DeadlineForm key={`${dangSuaId ?? "new"}:${hienFormThem}`}
          hienFormThem={hienFormThem}
          dangSuaId={dangSuaId}
          tieuDe={tieuDe}
          hanChot={hanChot}
          doUuTien={doUuTien}
          onTieuDeChange={setTieuDe}
          onHanChotChange={setHanChot}
          onDoUuTienChange={setDoUuTien}
          onSubmit={xuLySubmit}
          saving={saving}
          onCancel={moFormThem}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800">
          <label htmlFor="deadline-priority-filter" className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Mức quan trọng
            <select aria-label="Mức quan trọng" id="deadline-priority-filter" value={mucQuanTrongLoc} onChange={event => setMucQuanTrongLoc(event.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
              <option value="all">Tất cả mức</option>
              {DEADLINE_PRIORITIES.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
        </div>

        {!dangTai && !loadError && <div className="space-y-1 text-sm">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={tuDongXoa} onChange={luuTuyChon} disabled={saving} className="h-5 w-5 accent-ink-600" />
            Tự xóa việc đã hoàn thành sau 24 giờ
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tính từ lúc hoàn thành. Bật sẽ áp dụng cả việc cũ đã quá 24 giờ. Có thể xem lại và khôi phục ở Đã xóa; tắt sẽ dừng tự xóa các việc còn lại.</p>
        </div>}

        {!dangTai&&!loadError&&cheDoXem==='calendar'&&mucQuanTrongLoc!=='all'&&danhSachLoc.length===0&&<div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          <span>Không có deadline ở mức {tenMucLoc}.</span>
          <button type="button" onClick={()=>setMucQuanTrongLoc('all')} className="min-h-11 font-medium text-ink-600 dark:text-ink-300">Xem tất cả mức</button>
        </div>}

        {loadError ? <DataLoadError message={loadError} onRetry={taiDuLieu} /> : dangTai ? (
          <PageSkeleton />
        ) : cheDoXem === 'calendar' ? (
          <DeadlineCalendarView
            disabled={saving}
            thangXemLich={thangXemLich}
            ngayDuocChon={ngayDuocChon}
            priorityLabel={tenMucLoc}
            danhSach={danhSachLoc}
            onChonNgay={setNgayDuocChon}
            onDoiThang={doiThang}
            onHoanThanh={xuLyHoanThanh}
            onSua={moFormSua}
            onXoa={yeuCauXoa}
          />
        ) : (
          <DeadlineListView
            autoDelete={tuDongXoa}
            disabled={saving}
            emptyMessage={mucQuanTrongLoc === 'all' ? undefined : `Không có công việc chưa hoàn thành ở mức ${tenMucLoc}.`}
            dangDienHanh={dangDienHanh}
            daHoanThanh={daHoanThanh}
            onHoanThanh={xuLyHoanThanh}
            onSua={moFormSua}
            onXoa={yeuCauXoa}
          />
        )}
        {!dangTai && !loadError && <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-slate-600 dark:text-slate-300">Đã xóa ({daXoa.length})</summary>
          <p className="mb-3 text-xs text-slate-500">Các việc tự xóa sau 24 giờ được giữ ở đây để xem lại. Khôi phục sẽ đưa về chưa hoàn thành.</p>
          <div className="grid gap-2">{daXoa.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium dark:text-slate-100">{item.tieuDe}</h3><p className="text-xs text-slate-500">{formatDeadlineDate(item.hanChot)}</p></div>
            <button type="button" disabled={saving} onClick={() => khoiPhuc(item)} className="min-h-11 rounded-lg border px-3 text-sm text-ink-600 dark:border-slate-600 dark:text-ink-200">Khôi phục</button>
            <button type="button" disabled={saving} onClick={() => yeuCauXoa(item)} className="min-h-11 rounded-lg px-3 text-sm text-rose-600 dark:text-rose-300">Xóa vĩnh viễn</button>
          </article>)}{!daXoa.length && <p className="text-sm text-slate-500">Chưa có việc tự xóa.</p>}</div>
        </details>}
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
