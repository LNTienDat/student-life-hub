import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const [gpa, setGpa] = useState(null);
  const [deadlinesSapToi, setDeadlinesSapToi] = useState([]);
  const [monNguyCo, setMonNguyCo] = useState([]);
  const [thongKeTaiChinh, setThongKeTaiChinh] = useState(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    async function taiDuLieu() {
      try {
        const [resGpa, resDeadline, resCanhBao, resTaiChinh] = await Promise.all([
          api.get('/academic/gpa'),
          api.get('/deadline/sap-toi?soNgay=7'),
          api.get('/academic/canh-bao'),
          api.get('/finance/thong-ke'),
        ]);
        setGpa(resGpa.data.gpa);
        setDeadlinesSapToi(resDeadline.data.deadlines);
        setMonNguyCo(resCanhBao.data.monNguyCo);
        setThongKeTaiChinh(resTaiChinh.data);
      } catch (error) {
        console.error(error);
      } finally {
        setDangTai(false);
      }
    }
    taiDuLieu();
  }, []);

  function dinhDangTien(so) {
    return so.toLocaleString('vi-VN') + ' đ';
  }

  function dinhDangNgay(ngay) {
    return new Date(ngay).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Xin chào, {user?.ten}!
        </h1>
        <p className="text-gray-500 mb-6">Đây là tổng quan tình hình của bạn</p>

        {dangTai ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : (
          <>
            {/* Hàng số liệu tổng quan */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Link
                to="/mon-hoc"
                className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">GPA hiện tại</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{gpa ?? '--'}</p>
              </Link>

              <Link
                to="/deadline"
                className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">Deadline sắp tới (7 ngày)</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">
                  {deadlinesSapToi.length}
                </p>
              </Link>

              <Link
                to="/tai-chinh"
                className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">Số dư tháng này</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    thongKeTaiChinh?.soDu >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '--'}
                </p>
              </Link>
            </div>

            {/* Cảnh báo môn nguy cơ */}
            {monNguyCo.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-red-700 mb-2">
                  ⚠ Cảnh báo: {monNguyCo.length} môn có nguy cơ điểm thấp
                </p>
                <div className="flex flex-wrap gap-2">
                  {monNguyCo.map((mon, i) => (
                    <span
                      key={i}
                      className="text-sm bg-white px-3 py-1 rounded border border-red-200"
                    >
                      {mon.ten}: {mon.diemHienTai}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Deadline sắp tới */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-gray-700">Deadline sắp tới</h2>
                  <Link to="/deadline" className="text-sm text-blue-600 hover:underline">
                    Xem tất cả
                  </Link>
                </div>
                {deadlinesSapToi.length === 0 ? (
                  <p className="text-gray-400 text-sm">Không có deadline nào sắp tới.</p>
                ) : (
                  <div className="space-y-2">
                    {deadlinesSapToi.slice(0, 5).map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                      >
                        <span>{d.tieuDe}</span>
                        <span className="text-gray-400">{dinhDangNgay(d.hanChot)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chi tiêu theo danh mục */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-gray-700">Chi tiêu tháng này</h2>
                  <Link to="/tai-chinh" className="text-sm text-blue-600 hover:underline">
                    Xem chi tiết
                  </Link>
                </div>
                {!thongKeTaiChinh || Object.keys(thongKeTaiChinh.theoDanhMuc).length === 0 ? (
                  <p className="text-gray-400 text-sm">Chưa có chi tiêu nào tháng này.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(thongKeTaiChinh.theoDanhMuc).map(([danhMuc, soTien]) => (
                      <div
                        key={danhMuc}
                        className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                      >
                        <span className="capitalize">{danhMuc.replace('_', ' ')}</span>
                        <span className="text-red-600 font-medium">
                          {dinhDangTien(soTien)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;