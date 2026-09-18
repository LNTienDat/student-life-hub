import { useState, useEffect } from 'react';
import { getCache, setCache, clearCache } from '../services/apiCache';
import financeService from '../services/financeService';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { TEN_DANH_MUC } from '../constants';
import { dinhDangTien } from '../utils/formatters';
import { Plus, X, Download } from 'lucide-react';

import FinanceKpiCards from './taichinh/FinanceKpiCards';
import BudgetSection from './taichinh/BudgetSection';
import FinanceTrendChart from './taichinh/FinanceTrendChart';
import TransactionForm from './taichinh/TransactionForm';
import TransactionTable from './taichinh/TransactionTable';

function TaiChinh() {
  const now = new Date();
  const [thang] = useState(now.getMonth() + 1);
  const [nam] = useState(now.getFullYear());

  const cached = getCache('finance_cache');
  const [giaoDichs, setGiaoDichs] = useState([]);
  const [thongKe, setThongKe] = useState(cached?.thongKe ?? null);
  const [nganSachs, setNganSachs] = useState(cached?.nganSachs ?? []);
  const [xuHuong, setXuHuong] = useState(cached?.xuHuong ?? []);
  const [dangTai, setDangTai] = useState(!cached);

  const [hienFormGD, setHienFormGD] = useState(false);
  const [loai, setLoai] = useState('chi');
  const [danhMuc, setDanhMuc] = useState('an_uong');
  const [soTien, setSoTien] = useState('');
  const [moTa, setMoTa] = useState('');
  const [ngayGiaoDich, setNgayGiaoDich] = useState('');

  function doiLoaiGiaoDich(loaiMoi) {
    setLoai(loaiMoi);
    if (loaiMoi === 'thu') {
      setDanhMuc('luong');
    } else {
      setDanhMuc('an_uong');
    }
  }

  // Pagination & Filter
  const [timKiem, setTimKiem] = useState('');
  const [locLoai, setLocLoai] = useState('');
  const [locDanhMuc, setLocDanhMuc] = useState('');
  const [chiThangNay, setChiThangNay] = useState(false);

  const [trangHienTai, setTrangHienTai] = useState(1);
  const [soTrang, setSoTrang] = useState(1);
  const [tongSoGiaoDich, setTongSoGiaoDich] = useState(0);
  const [dangTaiGD, setDangTaiGD] = useState(false);

  // State modal xác nhận và toast
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
  const [dangXuatExcel, setDangXuatExcel] = useState(false);

  useEffect(() => {
    async function taiThongKe() {
      try {
        const [resTK, resNS, resXH] = await Promise.all([
          financeService.layThongKe(),
          financeService.layNganSach(),
          financeService.layXuHuong(6),
        ]);
        const data = {
          thongKe: resTK.data,
          nganSachs: resNS.data.ketQua || [],
          xuHuong: resXH.data.xuHuong || [],
        };
        setThongKe(data.thongKe);
        setNganSachs(data.nganSachs);
        setXuHuong(data.xuHuong);
        setCache('finance_cache', data);
      } catch (error) {
        console.error(error);
      } finally {
        setDangTai(false);
      }
    }
    taiThongKe();
  }, []);

  async function taiGiaoDich(page = 1) {
    setDangTaiGD(true);
    try {
      const res = await financeService.layDanhSachGiaoDich({
        page,
        limit: 10,
        timKiem,
        loai: locLoai,
        danhMuc: locDanhMuc,
        chiThangNay,
      });
      setGiaoDichs(res.data.giaoDichs);
      setSoTrang(res.data.soTrang);
      setTrangHienTai(res.data.trangHienTai);
      setTongSoGiaoDich(res.data.tongSo);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTaiGD(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      taiGiaoDich(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [timKiem, locLoai, locDanhMuc, chiThangNay]);

  async function xuLyThemGiaoDich(e) {
    e.preventDefault();
    try {
      await financeService.themGiaoDich({
        soTien: parseFloat(soTien),
        loai,
        danhMuc,
        moTa,
        ngayGiaoDich: ngayGiaoDich || undefined,
      });
      setSoTien('');
      setMoTa('');
      setNgayGiaoDich('');
      setHienFormGD(false);

      const [resTK, resNS] = await Promise.all([
        financeService.layThongKe(),
        financeService.layNganSach(),
      ]);
      setThongKe(resTK.data);
      setNganSachs(resNS.data.nganSachs);
      clearCache('dashboard_cache');
      clearCache('finance_cache');
      taiGiaoDich(1);
      hienToast('success', 'Thêm giao dịch thành công!');
    } catch (error) {
      console.error(error);
      hienToast('error', error.response?.data?.message || 'Không thể thêm giao dịch!');
    }
  }

  function yeuCauXoaGiaoDich(gd) {
    setModalXacNhan({
      isOpen: true,
      title: 'Xác nhận xóa giao dịch',
      subTitle: `Ngày: ${new Date(gd.ngayGiaoDich).toLocaleDateString('vi-VN')}`,
      itemInfo: {
        label: gd.moTa || TEN_DANH_MUC[gd.danhMuc] || gd.danhMuc,
        value: `${gd.loai === 'thu' ? '+' : '-'}${gd.soTien.toLocaleString('vi-VN')} đ`,
        extra: gd.loai === 'thu' ? 'Thu nhập' : 'Chi tiêu',
      },
      message: 'Bạn có chắc chắn muốn xóa giao dịch này không? Số dư và biểu đồ sẽ tự động được cập nhật lại.',
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      onConfirm: () => thucHienXoaGiaoDich(gd.id),
    });
  }

  async function thucHienXoaGiaoDich(id) {
    try {
      setModalXacNhan((prev) => ({ ...prev, isLoading: true }));
      await financeService.xoaGiaoDich(id);
      setModalXacNhan((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      hienToast('success', 'Đã xóa giao dịch thành công!');
      const resTK = await financeService.layThongKe();
      setThongKe(resTK.data);
      clearCache('dashboard_cache');
      clearCache('finance_cache');
      taiGiaoDich(trangHienTai);
    } catch (error) {
      console.error(error);
      setModalXacNhan((prev) => ({ ...prev, isLoading: false }));
      hienToast('error', error.response?.data?.message || 'Không thể xóa giao dịch!');
    }
  }

  async function xuLyXuatExcel() {
    try {
      setDangXuatExcel(true);
      const res = await financeService.xuatBaoCaoExcel(thang, nam);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao-cao-tai-chinh-${thang}-${nam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      hienToast('success', `Đã tải về báo cáo tài chính tháng ${thang}/${nam}!`);
    } catch (error) {
      console.error(error);
      hienToast('error', 'Không thể tải báo cáo tài chính. Hãy thử lại!');
    } finally {
      setDangXuatExcel(false);
    }
  }

  function taoGiaoDichNhanh(danhMucChon) {
    setLoai('chi');
    setDanhMuc(danhMucChon);
    setSoTien('');
    setMoTa('');
    setNgayGiaoDich('');
    setHienFormGD(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Tiêu đề & Hành động */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản lý tài chính
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Tháng {thang}/{nam}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={xuLyXuatExcel}
              disabled={dangXuatExcel || giaoDichs.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Xuất báo cáo Excel"
              aria-label="Xuất báo cáo tài chính ra file Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{dangXuatExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
            </button>
            <button
              onClick={() => setHienFormGD(!hienFormGD)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                hienFormGD
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-ink-600 dark:bg-ink-500 text-white hover:bg-ink-700 dark:hover:bg-ink-400 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienFormGD ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienFormGD ? 'Hủy' : 'Thêm giao dịch'}
            </button>
          </div>
        </div>

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : !thongKe ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-rose-500">Lỗi tải dữ liệu thống kê!</p>
          </div>
        ) : (
          <>
            {/* 1. Thống kê tổng quan */}
            <FinanceKpiCards thongKe={thongKe} />

            {/* 2. Layout 2 cột: Ngân sách & Biểu đồ xu hướng */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetSection
                nganSachs={nganSachs}
                thongKe={thongKe}
                onQuickTransaction={taoGiaoDichNhanh}
              />
              <FinanceTrendChart xuHuong={xuHuong} />
            </div>

            {/* 3. Lịch sử giao dịch */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              <TransactionForm
                hienFormGD={hienFormGD}
                loai={loai}
                danhMuc={danhMuc}
                soTien={soTien}
                moTa={moTa}
                ngayGiaoDich={ngayGiaoDich}
                onLoaiChange={doiLoaiGiaoDich}
                onDanhMucChange={setDanhMuc}
                onSoTienChange={setSoTien}
                onMoTaChange={setMoTa}
                onNgayGiaoDichChange={setNgayGiaoDich}
                onSubmit={xuLyThemGiaoDich}
              />

              <TransactionTable
                giaoDichs={giaoDichs}
                dangTaiGD={dangTaiGD}
                timKiem={timKiem}
                locLoai={locLoai}
                locDanhMuc={locDanhMuc}
                chiThangNay={chiThangNay}
                trangHienTai={trangHienTai}
                soTrang={soTrang}
                onTimKiemChange={setTimKiem}
                onLocLoaiChange={setLocLoai}
                onLocDanhMucChange={setLocDanhMuc}
                onChiThangNayChange={setChiThangNay}
                onChonTrang={taiGiaoDich}
                onYeuCauXoa={yeuCauXoaGiaoDich}
              />
            </div>
          </>
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

export default TaiChinh;
