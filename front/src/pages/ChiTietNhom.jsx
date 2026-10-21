import ModalDialog from '../components/ModalDialog';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, ArrowLeft, Plus, Copy, Check, ShieldCheck, Trash2,
  LogOut, Calendar, Clock
} from 'lucide-react';
import nhomService from '../services/nhomService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { dinhDangNgay } from '../utils/formatters';

function ChiTietNhom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hienToast } = useToast();

  const [nhom, setNhom] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const currentRoute = useRef(id);
  const loadVersion = useRef(0);
  const [vaiTro, setVaiTro] = useState('thanh_vien');
  const [dangTai, setDangTai] = useState(true);
  const submitLock = useRef(false);
  const confirmLock = useRef(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [maDaCopy, setMaDaCopy] = useState(false);

  // Modal tạo deadline nhóm
  const [hienModalDeadline, setHienModalDeadline] = useState(false);
  const [tieuDeDeadline, setTieuDeDeadline] = useState('');
  const [moTaDeadline, setMoTaDeadline] = useState('');
  const [hanChotDeadline, setHanChotDeadline] = useState('');
  const [doUuTienDeadline, setDoUuTienDeadline] = useState('binh_thuong');
  const [dangXuLyDeadline, setDangXuLyDeadline] = useState(false);

  // Confirm modal
  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    type: 'danger',
    onConfirm: () => {},
  });

  async function taiChiTiet() {
    if (currentRoute.current !== id) return;
    const version = ++loadVersion.current;
    try {
      const res = await nhomService.layChiTietNhom(id);
      if (version !== loadVersion.current || currentRoute.current !== id) return;
      setLoadedId(id);
      setNhom(res.data.nhom);
      setVaiTro(res.data.vaiTroCuaBan);
    } catch (error) {
      if (version !== loadVersion.current || currentRoute.current !== id) return;
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Không thể tải thông tin nhóm');
      navigate('/nhom');
    } finally {
      if (version === loadVersion.current && currentRoute.current === id) setDangTai(false);
    }
  }

  useEffect(() => {
    let active = true;
    currentRoute.current = id;
    const version = ++loadVersion.current;
    nhomService.layChiTietNhom(id).then(res => {
      if (!active || version !== loadVersion.current) return;
      setLoadedId(id); setNhom(res.data.nhom); setVaiTro(res.data.vaiTroCuaBan);
    }).catch(error => {
      if (!active || version !== loadVersion.current) return;
      hienToast('error', error.response?.data?.message || 'Không thể tải thông tin nhóm');
      navigate('/nhom');
    }).finally(() => { if (active && version === loadVersion.current) setDangTai(false); });
    return () => { active = false; };
  }, [id, hienToast, navigate]);

  async function copyMaNhom() {
    if (!nhom) return;
    try { await navigator.clipboard.writeText(nhom.maCode); }
    catch { hienToast('error', 'Chưa sao chép được. Bạn có thể chọn và sao chép mã thủ công.'); return; }
    setMaDaCopy(true);
    hienToast('success', `Đã sao chép mã mời: ${nhom.maCode}`);
    setTimeout(() => setMaDaCopy(false), 2000);
  }

  async function xuLyTaoDeadline(e) {
    e.preventDefault();
    if (!tieuDeDeadline.trim() || !hanChotDeadline) {
      hienToast('error', 'Vui lòng nhập đầy đủ tiêu đề và hạn chót');
      return;
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setDangXuLyDeadline(true);
    try {
      await nhomService.themDeadlineNhom(id, {
        tieuDe: tieuDeDeadline,
        moTa: moTaDeadline,
        hanChot: hanChotDeadline,
        doUuTien: doUuTienDeadline,
      });
      hienToast('success', 'Thêm deadline nhóm thành công!');
      setTieuDeDeadline('');
      setMoTaDeadline('');
      setHanChotDeadline('');
      setDoUuTienDeadline('binh_thuong');
      setHienModalDeadline(false);
      taiChiTiet();
    } catch (error) {
      hienToast('error', error.response?.data?.message || 'Có lỗi khi tạo deadline');
    } finally {
      submitLock.current = false;
      setDangXuLyDeadline(false);
    }
  }

  async function xuLyDoiTienDo(idDeadline, trangThaiMoi) {
    try {
      await nhomService.capNhatTienDo(id, idDeadline, { trangThai: trangThaiMoi });
      hienToast('success', 'Đã cập nhật tiến độ của bạn!');
      taiChiTiet();
    } catch {
      hienToast('error', 'Không thể cập nhật tiến độ');
    }
  }

  function xacNhanXoaDeadline(idDeadline, tieuDe) {
    setModalConfirm({
      isOpen: true,
      title: 'Xóa deadline nhóm?',
      message: `Bạn có chắc chắn muốn xóa deadline "${tieuDe}"? Tất cả tiến độ của các thành viên cũng sẽ bị xóa.`,
      confirmText: 'Xác nhận xóa',
      type: 'danger',
      onConfirm: async () => {
        try {
          await nhomService.xoaDeadlineNhom(id, idDeadline);
          hienToast('success', 'Đã xóa deadline nhóm');
          setModalConfirm((prev) => ({ ...prev, isOpen: false }));
          taiChiTiet();
        } catch (error) {
          hienToast('error', error.response?.data?.message || 'Có lỗi khi xóa deadline');
        }
      },
    });
  }

  function xacNhanRoiNhom() {
    setModalConfirm({
      isOpen: true,
      title: 'Rời nhóm học tập?',
      message: `Bạn có chắc chắn muốn rời khỏi nhóm "${nhom.ten}"? Bạn sẽ không còn quyền xem các deadline và tiến độ của nhóm.`,
      confirmText: 'Rời nhóm',
      type: 'danger',
      onConfirm: async () => {
        try {
          await nhomService.roiNhom(id);
          hienToast('success', 'Bạn đã rời nhóm');
          navigate('/nhom');
        } catch (error) {
          hienToast('error', error.response?.data?.message || 'Có lỗi khi rời nhóm');
        }
      },
    });
  }

  function xacNhanGiaiTanNhom() {
    setModalConfirm({
      isOpen: true,
      title: 'Giải tán nhóm học tập?',
      message: `Hành động này sẽ XÓA VĨNH VIỄN nhóm "${nhom.ten}" cùng toàn bộ deadline và lịch sử tiến độ. Không thể hoàn tác!`,
      confirmText: 'Giải tán vĩnh viễn',
      type: 'danger',
      onConfirm: async () => {
        try {
          await nhomService.xoaNhom(id);
          hienToast('success', 'Đã giải tán nhóm thành công');
          navigate('/nhom');
        } catch (error) {
          hienToast('error', error.response?.data?.message || 'Có lỗi khi giải tán nhóm');
        }
      },
    });
  }

  function xacNhanKick(idThanhVien, tenThanhVien) {
    setModalConfirm({
      isOpen: true,
      title: 'Xóa thành viên khỏi nhóm?',
      message: `Bạn có chắc muốn xóa thành viên "${tenThanhVien}" khỏi nhóm này?`,
      confirmText: 'Xóa khỏi nhóm',
      type: 'danger',
      onConfirm: async () => {
        try {
          await nhomService.kickThanhVien(id, idThanhVien);
          hienToast('success', `Đã xóa ${tenThanhVien} khỏi nhóm`);
          setModalConfirm((prev) => ({ ...prev, isOpen: false }));
          taiChiTiet();
        } catch (error) {
          hienToast('error', error.response?.data?.message || 'Có lỗi xảy ra');
        }
      },
    });
  }

  async function confirmAction() {
    if (confirmLock.current) return;
    confirmLock.current = true;
    setConfirmBusy(true);
    try { await modalConfirm.onConfirm(); }
    finally { confirmLock.current = false; setConfirmBusy(false); }
  }

  if (dangTai || !nhom || loadedId !== id) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <PageSkeleton />
      </div>
    );
  }

  const laChuNhom = vaiTro === 'chu_nhom';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header nhóm */}
      <div className="flex flex-col gap-4">
        <Link
          to="/nhom"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách nhóm
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                {nhom.ten}
              </h1>
              {laChuNhom && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Bạn là Trưởng nhóm
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {nhom.moTa || 'Chưa có mô tả nhóm.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Hộp mã mời */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500">Mã mời:</span>
              <span className="font-mono font-bold text-sm text-ink-600 dark:text-ink-400 tracking-wider">
                {nhom.maCode}
              </span>
              <button
                onClick={copyMaNhom}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Sao chép mã"
              >
                {maDaCopy ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {laChuNhom ? (
              <button
                onClick={xacNhanGiaiTanNhom}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Giải tán nhóm
              </button>
            ) : (
              <button
                onClick={xacNhanRoiNhom}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Rời nhóm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thân trang: 2 cột (Deadline nhóm + Danh sách thành viên) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái (2/3): Danh sách deadline nhóm */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ink-600 dark:text-ink-400" />
                Deadline của nhóm ({nhom.deadlineNhoms?.length || 0})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi và đánh dấu tiến độ làm việc của từng bạn trong nhóm.
              </p>
            </div>

            <button
              onClick={() => setHienModalDeadline(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-600 hover:bg-ink-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm deadline
            </button>
          </div>

          {nhom.deadlineNhoms?.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-10 text-center">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nhóm chưa có deadline nào</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Thêm bài tập lớn, lịch nộp báo cáo hoặc các mốc quan trọng để cả nhóm cùng theo dõi.
              </p>
              <button
                onClick={() => setHienModalDeadline(true)}
                className="px-4 py-2 rounded-xl bg-ink-600 hover:bg-ink-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo deadline đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {nhom.deadlineNhoms.map((dl) => {
                const tienDoCuaToi = dl.tienDos.find((td) => td.idNguoiDung === user?.id);
                const trangThaiCuaToi = tienDoCuaToi?.trangThai || 'chua_lam';
                const activeMembers = new Set(nhom.thanhViens.map(tv => tv.idNguoiDung));
                const soHoanThanh = dl.tienDos.filter(td => activeMembers.has(td.idNguoiDung) && td.trangThai === 'hoan_thanh').length;
                const tongThanhVien = nhom.thanhViens.length || 1;
                const phanTramHoanThanh = Math.round((soHoanThanh / tongThanhVien) * 100);

                const coQuyenXoa = laChuNhom || dl.idNguoiTao === user?.id;

                return (
                  <div
                    key={dl.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm space-y-4"
                  >
                    {/* Hàng 1: Tiêu đề + Hạn chót + Xóa */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {dl.tieuDe}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            dl.doUuTien === 'cao'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {dl.doUuTien === 'cao' ? 'Ưu tiên cao' : 'Bình thường'}
                          </span>
                        </div>
                        {dl.moTa && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {dl.moTa}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Hạn chót: <span className="font-semibold text-slate-700 dark:text-slate-200">{dinhDangNgay(dl.hanChot, true)}</span> • Tạo bởi: {dl.nguoiTao?.ten}
                        </p>
                      </div>

                      {coQuyenXoa && (
                        <button
                          onClick={() => xacNhanXoaDeadline(dl.id, dl.tieuDe)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          title="Xóa deadline này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Hàng 2: Thanh tiến độ tổng quan của nhóm */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Tiến độ cả nhóm:</span>
                        <span className="font-bold text-ink-600 dark:text-ink-400">
                          {soHoanThanh}/{tongThanhVien} bạn hoàn thành ({phanTramHoanThanh}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phanTramHoanThanh}%` }}
                        />
                      </div>
                    </div>

                    {/* Hàng 3: Tiến độ của chính tôi (Quick toggle) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Trạng thái của bạn:
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          trangThaiCuaToi === 'hoan_thanh'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : trangThaiCuaToi === 'dang_lam'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {trangThaiCuaToi === 'hoan_thanh' ? 'Đã xong' : trangThaiCuaToi === 'dang_lam' ? 'Đang làm' : 'Chưa làm'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {['chua_lam', 'dang_lam', 'hoan_thanh'].map((tt) => (
                          <button
                            key={tt}
                            onClick={() => xuLyDoiTienDo(dl.id, tt)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                              trangThaiCuaToi === tt
                                ? 'bg-ink-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {tt === 'chua_lam' ? 'Chưa làm' : tt === 'dang_lam' ? 'Đang làm' : 'Đã xong'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hàng 4: Chi tiết từng thành viên */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Tiến độ các thành viên:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dl.tienDos.map((td) => (
                          <div
                            key={td.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 text-xs"
                          >
                            <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[140px]">
                              {td.nguoiDung?.ten} {td.idNguoiDung === user?.id && '(Bạn)'}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              td.trangThai === 'hoan_thanh'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : td.trangThai === 'dang_lam'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                            }`}>
                              {td.trangThai === 'hoan_thanh' ? '✔ Đã xong' : td.trangThai === 'dang_lam' ? '⏳ Đang làm' : '○ Chưa làm'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột phải (1/3): Danh sách thành viên trong nhóm */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-ink-600 dark:text-ink-400" />
                Thành viên ({nhom.thanhViens?.length || 0})
              </span>
            </h2>

            <div className="space-y-3">
              {nhom.thanhViens?.map((tv) => {
                const laToi = tv.idNguoiDung === user?.id;
                const laChuNhomThanhVien = tv.vaiTro === 'chu_nhom';

                return (
                  <div
                    key={tv.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                        {tv.nguoiDung?.ten?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {tv.nguoiDung?.ten} {laToi && <span className="text-ink-600 dark:text-ink-400 font-normal">(Bạn)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {laChuNhomThanhVien ? 'Trưởng nhóm' : 'Thành viên'}
                        </p>
                      </div>
                    </div>

                    {laChuNhom && !laChuNhomThanhVien && (
                      <button
                        onClick={() => xacNhanKick(tv.idNguoiDung, tv.nguoiDung?.ten)}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                        title="Xóa thành viên này"
                      >
                        Đuổi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm Deadline Nhóm */}
      {hienModalDeadline && (
        <ModalDialog open={hienModalDeadline} onClose={() => setHienModalDeadline(false)} title="Thêm deadline nhóm" busy={dangXuLyDeadline}>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Deadline này sẽ hiển thị cho toàn bộ thành viên trong nhóm.
            </p>

            <form onSubmit={xuLyTaoDeadline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Tiêu đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tieuDeDeadline}
                  onChange={(e) => setTieuDeDeadline(e.target.value)}
                  placeholder="VD: Nộp slide thuyết trình đề tài"
                  maxLength={150}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Hạn chót <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={hanChotDeadline}
                  onChange={(e) => setHanChotDeadline(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={doUuTienDeadline}
                  onChange={(e) => setDoUuTienDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                >
                  <option value="thap">Thấp</option>
                  <option value="binh_thuong">Bình thường</option>
                  <option value="cao">Ưu tiên cao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mô tả / Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={moTaDeadline}
                  onChange={(e) => setMoTaDeadline(e.target.value)}
                  placeholder="VD: Cần tổng hợp trước 2 ngày để nộp cho nhóm trưởng..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setHienModalDeadline(false)}
                  disabled={dangXuLyDeadline}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLyDeadline}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-ink-600 hover:bg-ink-700 text-white shadow-sm"
                >
                  {dangXuLyDeadline ? 'Đang thêm...' : 'Tạo deadline'}
                </button>
              </div>
            </form>
        </ModalDialog>
      )}

      {/* Modal xác nhận */}
      <ConfirmModal
        isOpen={modalConfirm.isOpen}
        onClose={() => setModalConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction}
        isLoading={confirmBusy}
        title={modalConfirm.title}
        message={modalConfirm.message}
        confirmText={modalConfirm.confirmText}
        type={modalConfirm.type}
      />
    </div>
  );
}

export default ChiTietNhom;
