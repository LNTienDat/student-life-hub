import api from './api';

const nhomService = {
  // Lấy danh sách nhóm của tôi
  layDanhSachNhom: () => api.get('/nhom'),

  // Lấy chi tiết 1 nhóm
  layChiTietNhom: (id) => api.get(`/nhom/${id}`),

  // Tạo nhóm mới
  taoNhom: (data) => api.post('/nhom/tao', data),

  // Tham gia nhóm qua mã code
  thamGiaNhom: (maCode) => api.post('/nhom/tham-gia', { maCode }),

  // Cập nhật thông tin nhóm (chủ nhóm)
  suaNhom: (id, data) => api.put(`/nhom/${id}`, data),

  // Xóa nhóm (chủ nhóm)
  xoaNhom: (id) => api.delete(`/nhom/${id}`),

  // Tự rời khỏi nhóm
  roiNhom: (id) => api.delete(`/nhom/${id}/roi`),

  // Đuổi thành viên (chủ nhóm)
  kickThanhVien: (idNhom, idThanhVien) => api.delete(`/nhom/${idNhom}/kick/${idThanhVien}`),

  // Tạo deadline nhóm
  themDeadlineNhom: (idNhom, data) => api.post(`/nhom/${idNhom}/deadline`, data),

  // Sửa deadline nhóm
  suaDeadlineNhom: (idNhom, idDeadline, data) => api.put(`/nhom/${idNhom}/deadline/${idDeadline}`, data),

  // Xóa deadline nhóm
  xoaDeadlineNhom: (idNhom, idDeadline) => api.delete(`/nhom/${idNhom}/deadline/${idDeadline}`),

  // Cập nhật tiến độ của bản thân cho 1 deadline nhóm
  capNhatTienDo: (idNhom, idDeadline, data) => api.put(`/nhom/${idNhom}/deadline/${idDeadline}/tien-do`, data),
};

export default nhomService;
