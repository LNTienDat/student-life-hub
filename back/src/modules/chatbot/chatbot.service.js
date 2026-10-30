const { categoryLabels } = require('../finance/category.service');
const prisma = require('../../prismaClient');
const { tinhGPAService, canhBaoMonNguyCoService } = require('../academic/academic.service');
const { thongKeTaiChinhService, kiemTraNganSachService } = require('../finance/finance.service');
const { vietnamParts, monthRange } = require('../../utils/date.util');
const { CHATBOT } = require('../../constants');
const { filterSemester, normalizeSemester } = require('../../utils/semester.util');
const { dateKey, weekStart, loadWeek } = require('../thoikhoabieu/adjustments.service');

const CHU_DE = ['hocTap', 'deadline', 'taiChinh', 'lichHoc'];

const ngan = value => String(value || '').slice(0, 160);
function layThuTrongTuan(date) { return vietnamParts(date).weekday + 1; }
function formatTien(value) { return Number(value).toLocaleString('vi-VN').replaceAll('.', ' ') + ' đ'; }
function chuanHoa(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').toLowerCase(); }

// Data mode only handles periods it actually queries.
function timChuDe(text) {
  const q = chuanHoa(text);
  if (/tu van|goi y|ke hoach|lam sao|nen |cach |muc tieu|tiet kiem|thang truoc|thang sau|nam ngoai|tuan truoc|hom qua|ngay kia|thang \d|thang mot|thang hai|thang ba/.test(q)) return [];
  const topics = [];
  if (/\bgpa\b|diem|mon nguy co/.test(q)) topics.push('hocTap');
  if (/deadline|han chot|qua han|cong viec/.test(q)) topics.push('deadline');
  if (/thu chi|chi tieu|chi bao nhieu|tong chi|tong thu|thu nhap|so du|ngan sach|tai chinh/.test(q)) topics.push('taiChinh');
  if (/lich hoc|thoi khoa bieu|hoc gi|hoc mon nao/.test(q)) topics.push('lichHoc');
  return topics;
}

// All reads use the authenticated user. No raw transactions, email, password, IDs or notes enter the AI summary.
async function layDuLieuSinhVien(userId, topics = CHU_DE, now = new Date()) {
  const vn = vietnamParts(now);
  const { from, to } = monthRange(vn.month, vn.year);
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + CHATBOT.CONTEXT_DEADLINE_DAYS * 86400000);
  const result = { capNhatLuc: now.toISOString(), muiGio: 'Asia/Ho_Chi_Minh', phamVi: 'GPA/deadline: tất cả học kỳ; thu/chi: tháng hiện tại; lịch học: kỳ đang học, có điều chỉnh theo ngày.' };
  const jobs = [];
  if (topics.includes('hocTap')) jobs.push((async () => {
    const courses = await prisma.monHoc.findMany({ where: { idNguoiDung: userId }, select: { ten: true, tinChi: true, diems: { select: { diem: true, trongSo: true } } } });
    const { gpa, hasGrades } = tinhGPAService(courses);
    result.hocTap = {
      gpa: hasGrades ? gpa : null, soMon: courses.length,
      monNguyCo: canhBaoMonNguyCoService(courses).slice(0, 5).map(m => ({ ten: ngan(m.ten), diem: m.diemHienTai })),
      trongSoLoi: courses.some(m => m.diems.reduce((sum, d) => sum + d.trongSo, 0) > 100.000001),
    };
  })());
  if (topics.includes('deadline')) jobs.push((async () => {
    const base = { idNguoiDung: userId, trangThai: { not: 'hoan_thanh' } };
    const overdue = { ...base, hanChot: { lt: now } };
    const upcoming = { ...base, hanChot: { gte: now, lte: nextWeek } };
    const select = { tieuDe: true, hanChot: true, doUuTien: true };
    const [quaHan, sapToi, tongQuaHan, tongSapToi] = await Promise.all([
      prisma.deadline.findMany({ where: overdue, orderBy: { hanChot: 'asc' }, take: 5, select }),
      prisma.deadline.findMany({ where: upcoming, orderBy: { hanChot: 'asc' }, take: 5, select }),
      prisma.deadline.count({ where: overdue }), prisma.deadline.count({ where: upcoming }),
    ]);
    const clean = d => ({ tieuDe: ngan(d.tieuDe), hanChot: d.hanChot.toISOString(), uuTien: d.doUuTien === 'cao' ? 'Khẩn cấp' : d.doUuTien === 'thap' ? 'Thấp' : 'Bình thường' });
    result.deadline = { tongQuaHan, tongSapToi, soNgaySapToi: CHATBOT.CONTEXT_DEADLINE_DAYS, quaHan: quaHan.map(clean), sapToi: sapToi.map(clean) };
  })());
  if (topics.includes('taiChinh')) jobs.push((async () => {
    const [groups, budgets, labels] = await Promise.all([
      prisma.giaoDich.groupBy({ by: ['loai', 'danhMuc'], where: { idNguoiDung: userId, ngayGiaoDich: { gte: from, lt: to } }, _sum: { soTien: true }, _count: { _all: true } }),
      prisma.nganSach.findMany({ where: { idNguoiDung: userId, thang: vn.month, nam: vn.year }, select: { danhMuc: true, soTienToiDa: true } }),
      categoryLabels(userId),
    ]);
    const transactions = groups.map(g => ({ loai: g.loai, danhMuc: g.danhMuc, soTien: g._sum.soTien || 0 }));
    const { tongThu, tongChi, soDu } = thongKeTaiChinhService(transactions);
    result.taiChinh = {
      thang: vn.month, nam: vn.year, tongThu, tongChi, soDu, soGiaoDich: groups.reduce((sum, g) => sum + g._count._all, 0),
      nganSach: kiemTraNganSachService(budgets, transactions.filter(g => g.loai === 'chi')).map(b => ({ danhMuc: labels[b.danhMuc] || 'Khác', hanMuc: b.hanMuc, daChi: b.daChi, vuot: b.vuotNganSach })),
    };
  })());
  if (topics.includes('lichHoc')) jobs.push((async () => {
    const [profile, rows] = await Promise.all([
      prisma.nguoiDung.findUnique({ where: { id: userId }, select: { hocKyHienTai: true } }),
      prisma.thoiKhoaBieu.findMany({ where: { idNguoiDung: userId }, orderBy: { gioBatDau: 'asc' } }),
    ]);
    const hocKy = normalizeSemester(profile?.hocKyHienTai);
    const base = filterSemester(rows, hocKy, true);
    const today = dateKey(now), next = dateKey(tomorrow);
    const currentWeek = await loadWeek(prisma, userId, base, today);
    const nextWeek = weekStart(next) === currentWeek.tuNgay ? currentWeek : await loadWeek(prisma, userId, base, next);
    const clean = c => ({ mon: ngan(c.tenMon), batDau: c.gioBatDau, ketThuc: c.gioKetThuc, phong: ngan(c.phongHoc), hocKy: ngan(c.hocKy) });
    result.lichHoc = { hocKy: ngan(hocKy), homNay: currentWeek.thoiKhoaBieu.filter(c => c.ngayHoc === today).map(clean), ngayMai: nextWeek.thoiKhoaBieu.filter(c => c.ngayHoc === next).map(clean) };
  })());
  await Promise.all(jobs);
  return result;
}

function traLoiDuLieu(data, text) {
  const parts = [];
  if (data.hocTap) {
    const h = data.hocTap;
    parts.push(h.gpa === null ? 'Chưa có điểm để tính GPA.' : 'GPA tích lũy: **' + h.gpa + '/10**, tạm tính từ các điểm đã nhập (tất cả học kỳ).');
    if (h.trongSoLoi) parts.push('Có môn có tổng trọng số vượt 100%. Hãy sửa trọng số trước khi dùng kết quả GPA.');
    if (h.monNguyCo.length) parts.push('Môn đang dưới 5 điểm: ' + h.monNguyCo.map(m => m.ten + ' (' + m.diem + ')').join(', ') + '.');
  }
  if (data.deadline) {
    const d = data.deadline;
    parts.push('**' + d.tongQuaHan + ' việc quá hạn · ' + d.tongSapToi + ' việc trong ' + d.soNgaySapToi + ' ngày tới**');
    const format = (item, label) => '- ' + label + ': ' + item.tieuDe + ' — ' + new Date(item.hanChot).toLocaleDateString('vi-VN', { timeZone: data.muiGio }) + ' (' + item.uuTien + ')';
    parts.push(...d.quaHan.map(item => format(item, 'Quá hạn')), ...d.sapToi.map(item => format(item, 'Sắp tới')));
    if (d.tongQuaHan > 5 || d.tongSapToi > 5) parts.push('Hiển thị tối đa 5 việc mỗi nhóm. Mở Deadline để xem đầy đủ.');
  }
  if (data.taiChinh) {
    const f = data.taiChinh;
    parts.push('**Thu/chi tháng ' + f.thang + '/' + f.nam + '**', 'Thu: ' + formatTien(f.tongThu) + ' · Chi: ' + formatTien(f.tongChi), 'Số dư trong tháng: **' + formatTien(f.soDu) + '** (thu trừ chi).');
    if (!f.soGiaoDich) parts.push('Chưa có giao dịch trong tháng này.');
    if (/ngan sach/.test(chuanHoa(text))) parts.push(f.nganSach.length ? f.nganSach.map(b => '- ' + b.danhMuc + ': đã chi ' + formatTien(b.daChi) + '/' + formatTien(b.hanMuc) + (b.vuot ? ' — vượt ngân sách' : '')).join('\n') : 'Bạn chưa đặt ngân sách tháng này.');
  }
  if (data.lichHoc) {
    const isTomorrow = /ngay mai|mai hoc/.test(chuanHoa(text));
    const title = isTomorrow ? 'Ngày mai' : 'Hôm nay';
    const classes = isTomorrow ? data.lichHoc.ngayMai : data.lichHoc.homNay;
    parts.push(classes.length ? '**' + title + ': ' + classes.length + ' buổi học**\n' + classes.map(c => '- ' + c.batDau + '–' + c.ketThuc + ': ' + c.mon + (c.phong ? ' · ' + c.phong : '') + (c.hocKy ? ' · ' + c.hocKy : '')).join('\n') : title + ' chưa có buổi học nào trong lịch đã nhập.');
    parts.push((data.lichHoc.hocKy ? 'Học kỳ đang học: ' + data.lichHoc.hocKy + ', gồm lịch dùng chung.' : 'Chưa chọn học kỳ đang học; đang xem tất cả học kỳ.') + ' Đã tính các buổi nghỉ và đổi lịch theo ngày.');
  }
  return parts.join('\n');
}
module.exports = { layDuLieuSinhVien, timChuDe, traLoiDuLieu, layThuTrongTuan, formatTien };
