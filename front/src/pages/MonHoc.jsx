import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';

function MonHoc() {
  const [danhSach, setDanhSach] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [gpaTheoKy, setGpaTheoKy] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);

  const [tenMon, setTenMon] = useState('');
  const [tinChi, setTinChi] = useState('');
  const [hocKy, setHocKy] = useState('');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const [resMonHoc, resGpa, resGpaKy] = await Promise.all([
        api.get('/academic/mon-hoc'),
        api.get('/academic/gpa'),
        api.get('/academic/gpa-theo-ky'),
      ]);
      setDanhSach(resMonHoc.data.monHocs);
      setGpa(resGpa.data.gpa);
      setGpaTheoKy(resGpaKy.data.theoKy);
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
    setDangSuaId(null);
    setTenMon('');
    setTinChi('');
    setHocKy('');
    setHienFormThem(!hienFormThem);
  }

  function moFormSua(mon) {
    setHienFormThem(true);
    setDangSuaId(mon.id);
    setTenMon(mon.ten);
    setTinChi(mon.tinChi.toString());
    setHocKy(mon.hocKy);
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    try {
      if (dangSuaId) {
        await api.put(`/academic/mon-hoc/${dangSuaId}`, {
          ten: tenMon,
          tinChi: parseInt(tinChi),
          hocKy,
        });
      } else {
        await api.post('/academic/mon-hoc', {
          ten: tenMon,
          tinChi: parseInt(tinChi),
          hocKy,
        });
      }
      setTenMon('');
      setTinChi('');
      setHocKy('');
      setHienFormThem(false);
      setDangSuaId(null);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyXoaMon(id) {
    if (!confirm('Bạn chắc chắn muốn xóa môn học này?')) return;
    try {
      await api.delete(`/academic/mon-hoc/${id}`);
      taiDuLieu();
    } catch (error) {
      alert('Xóa thất bại');
    }
  }

  async function xuLyXuatBangDiem() {
    try {
      const res = await api.get('/academic/xuat-bang-diem', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bang-diem.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Không thể xuất bảng điểm. Vui lòng thử lại.');
    }
  }

  function tinhDiemMon(diems) {
    const tongTrongSo = diems.reduce((sum, d) => sum + d.trongSo, 0);
    if (tongTrongSo === 0) return null;
    const diemMon = diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);
    return diemMon.toFixed(2);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý học tập</h1>
            {gpa !== null && (
              <p className="text-gray-600 mt-1">
                GPA hiện tại: <span className="font-bold text-blue-600">{gpa}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={xuLyXuatBangDiem}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Xuất bảng điểm (PDF)
            </button>
            <button
              onClick={moFormThem}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {hienFormThem ? 'Hủy' : '+ Thêm môn học'}
            </button>
          </div>
        </div>

        {gpaTheoKy.length > 1 && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">GPA theo học kỳ</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gpaTheoKy}>
                <XAxis dataKey="hocKy" fontSize={12} />
                <YAxis domain={[0, 10]} fontSize={12} />
                <Tooltip />
                <Bar dataKey="gpa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hienFormThem && (
          <form
            onSubmit={xuLySubmit}
            className="bg-white p-4 rounded-lg shadow mb-6 flex gap-3 items-end"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Tên môn</label>
              <input
                type="text"
                value={tenMon}
                onChange={(e) => setTenMon(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Tín chỉ</label>
              <input
                type="number"
                value={tinChi}
                onChange={(e) => setTinChi(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Học kỳ</label>
              <input
                type="text"
                value={hocKy}
                onChange={(e) => setHocKy(e.target.value)}
                placeholder="HK1 2024-2025"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {dangSuaId ? 'Cập nhật' : 'Lưu'}
            </button>
          </form>
        )}

        {dangTai ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : danhSach.length === 0 ? (
          <p className="text-gray-500">Chưa có môn học nào. Hãy thêm môn học đầu tiên!</p>
        ) : (
          <div className="grid gap-4">
            {danhSach.map((mon) => {
              const diemMon = tinhDiemMon(mon.diems);
              return (
                <div key={mon.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{mon.ten}</h3>
                      <p className="text-sm text-gray-500">
                        {mon.tinChi} tín chỉ · {mon.hocKy}
                      </p>
                    </div>
                    <div className="text-right">
                      {diemMon && (
                        <span
                          className={`text-lg font-bold ${
                            parseFloat(diemMon) < 5 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {diemMon}
                        </span>
                      )}
                      <div className="flex gap-2 mt-1 justify-end">
                        <button
                          onClick={() => moFormSua(mon)}
                          className="text-blue-500 text-xs hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => xuLyXoaMon(mon.id)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>

                  {mon.diems.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {mon.diems.map((d) => (
                        <span
                          key={d.id}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {d.loaiDanhGia}: {d.diem} ({d.trongSo}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MonHoc;