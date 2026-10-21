import ModalDialog from '../components/ModalDialog';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, UserPlus, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import nhomService from '../services/nhomService';
import { useToast } from '../context/ToastContext';
import { PageSkeleton } from '../components/Skeleton';

function NhomHocTap() {
  const [danhSachNhom, setDanhSachNhom] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const submitLock = useRef(false);
  const [hienModalTao, setHienModalTao] = useState(false);
  const [hienModalThamGia, setHienModalThamGia] = useState(false);

  // Form states
  const [tenNhom, setTenNhom] = useState('');
  const [moTa, setMoTa] = useState('');
  const [maCodeThamGia, setMaCodeThamGia] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [maCopy, setMaCopy] = useState(null);

  const { hienToast } = useToast();

  async function taiDanhSachNhom() {
    try {
      const res = await nhomService.layDanhSachNhom();
      setDanhSachNhom(res.data.nhoms || []);
    } catch (error) {
      console.error(error);
      hienToast('error', 'Không thể tải danh sách nhóm');
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    let active = true;
    nhomService.layDanhSachNhom().then(res => {
      if (active) setDanhSachNhom(res.data.nhoms || []);
    }).catch(error => { if (active) hienToast('error', error.response?.data?.message || 'Không thể tải danh sách nhóm'); })
      .finally(() => { if (active) setDangTai(false); });
    return () => { active = false; };
  }, [hienToast]);

  async function xuLyTaoNhom(e) {
    e.preventDefault();
    if (!tenNhom.trim()) {
      hienToast('error', 'Vui lòng nhập tên nhóm');
      return;
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setDangXuLy(true);
    try {
      await nhomService.taoNhom({ ten: tenNhom, moTa });
      hienToast('success', 'Tạo nhóm học tập thành công!');
      setTenNhom('');
      setMoTa('');
      setHienModalTao(false);
      taiDanhSachNhom();
    } catch (error) {
      hienToast('error', error.response?.data?.message || 'Có lỗi khi tạo nhóm');
    } finally {
      submitLock.current = false;
      setDangXuLy(false);
    }
  }

  async function xuLyThamGia(e) {
    e.preventDefault();
    if (!maCodeThamGia.trim()) {
      hienToast('error', 'Vui lòng nhập mã nhóm');
      return;
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setDangXuLy(true);
    try {
      const res = await nhomService.thamGiaNhom(maCodeThamGia.trim().toUpperCase());
      hienToast('success', res.data?.message || 'Tham gia nhóm thành công!');
      setMaCodeThamGia('');
      setHienModalThamGia(false);
      taiDanhSachNhom();
    } catch (error) {
      hienToast('error', error.response?.data?.message || 'Mã nhóm không hợp lệ hoặc bạn đã ở trong nhóm');
    } finally {
      submitLock.current = false;
      setDangXuLy(false);
    }
  }

  async function copyMaCode(ma, e) {
    e.stopPropagation();
    e.preventDefault();
    try { await navigator.clipboard.writeText(ma); }
    catch { hienToast('error', 'Chưa sao chép được mã mời'); return; }
    setMaCopy(ma);
    hienToast('success', `Đã sao chép mã nhóm: ${ma}`);
    setTimeout(() => setMaCopy(null), 2000);
  }

  if (dangTai) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Tiêu đề & Nút thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-ink-600 dark:text-ink-400" />
            Nhóm học tập
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cùng bạn bè chia sẻ deadline môn học, theo dõi tiến độ bài tập lớn và học tập hiệu quả hơn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setHienModalThamGia(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            Tham gia bằng mã
          </button>
          <button
            onClick={() => setHienModalTao(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink-600 hover:bg-ink-700 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo nhóm mới
          </button>
        </div>
      </div>

      {/* Danh sách các nhóm */}
      {danhSachNhom.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-ink-50 dark:bg-ink-950/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-ink-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Chưa tham gia nhóm nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Tạo nhóm học tập cho lớp hoặc nhập mã code từ bạn bè để bắt đầu cùng theo dõi bài tập chung.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setHienModalThamGia(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              Nhập mã nhóm
            </button>
            <button
              onClick={() => setHienModalTao(true)}
              className="px-4 py-2 rounded-xl bg-ink-600 text-white text-sm font-medium hover:bg-ink-700"
            >
              Tạo nhóm ngay
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {danhSachNhom.map((nhom) => (
            <Link
              key={nhom.id}
              to={`/nhom/${nhom.id}`}
              className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 hover:border-ink-400 dark:hover:border-ink-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-ink-600 dark:group-hover:text-ink-400 transition-colors line-clamp-1">
                    {nhom.ten}
                  </h3>
                  {nhom.vaiTroCuaBan === 'chu_nhom' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex-shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Trưởng nhóm
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                  {nhom.moTa || 'Không có mô tả cho nhóm này.'}
                </p>

                {/* Mã mời */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-4 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Mã mời:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-ink-600 dark:text-ink-400">
                    <span>{nhom.maCode}</span>
                    <button
                      type="button"
                      onClick={(e) => copyMaCode(nhom.maCode, e)}
                      title="Sao chép mã"
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {maCopy === nhom.maCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer card: số thành viên & deadline */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span>👥 {nhom._count?.thanhViens || 0} thành viên</span>
                  <span>📌 {nhom._count?.deadlineNhoms || 0} deadline</span>
                </div>
                <span className="text-ink-600 dark:text-ink-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                  Xem <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Tạo nhóm mới */}
      {hienModalTao && (
        <ModalDialog open={hienModalTao} onClose={() => setHienModalTao(false)} title="Tạo nhóm học tập" busy={dangXuLy}>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Nhóm sẽ có mã mời riêng để bạn gửi cho các thành viên trong nhóm.
            </p>

            <form onSubmit={xuLyTaoNhom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Tên nhóm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  placeholder="VD: Nhóm Đồ Án Cơ Sở Dữ Liệu - K18"
                  maxLength={100}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="VD: Lịch nộp báo cáo và bài tập nhóm môn CSDL thầy Hùng..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setHienModalTao(false)}
                  disabled={dangXuLy}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLy}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-ink-600 hover:bg-ink-700 text-white shadow-sm"
                >
                  {dangXuLy ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
        </ModalDialog>
      )}

      {/* Modal Tham gia nhóm bằng mã code */}
      {hienModalThamGia && (
        <ModalDialog open={hienModalThamGia} onClose={() => setHienModalThamGia(false)} title="Tham gia nhóm học tập" busy={dangXuLy}>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Nhập mã mời gồm 6 ký tự được cung cấp bởi trưởng nhóm của bạn.
            </p>

            <form onSubmit={xuLyThamGia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mã mời nhóm
                </label>
                <input
                  type="text"
                  value={maCodeThamGia}
                  onChange={(e) => setMaCodeThamGia(e.target.value.toUpperCase())}
                  placeholder="VD: 7K9X2A"
                  maxLength={6}
                  required
                  className="w-full text-center tracking-widest font-mono text-lg font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setHienModalThamGia(false)}
                  disabled={dangXuLy}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={dangXuLy}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-ink-600 hover:bg-ink-700 text-white shadow-sm"
                >
                  {dangXuLy ? 'Đang kiểm tra...' : 'Tham gia'}
                </button>
              </div>
            </form>
        </ModalDialog>
      )}
    </div>
  );
}

export default NhomHocTap;
