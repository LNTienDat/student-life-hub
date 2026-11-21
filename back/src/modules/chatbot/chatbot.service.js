const { categoryLabels } = require('../finance/category.service');
const prisma = require('../../prismaClient');
const { tinhGPAService, canhBaoMonNguyCoService } = require('../academic/academic.service');
const { thongKeTaiChinhService, kiemTraNganSachService } = require('../finance/finance.service');
const { vietnamParts, monthRange } = require('../../utils/date.util');
const { CHATBOT } = require('../../constants');
const { filterSemester, normalizeSemester } = require('../../utils/semester.util');
const { dateKey, weekStart, plusDays, loadWeek } = require('../thoikhoabieu/adjustments.service');

const CHU_DE = ['hocTap', 'deadline', 'taiChinh', 'lichHoc'];

const ngan = value => String(value || '').slice(0, 160);
function layThuTrongTuan(date) { return vietnamParts(date).weekday + 1; }
function formatTien(value) { return Number(value).toLocaleString('vi-VN').replaceAll('.', ' ') + ' đ'; }
function chuanHoa(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').toLowerCase(); }

function khoangLich(text, now) {
  const q = chuanHoa(text), today = dateKey(now);
  for (const [pattern, offset, label] of [[/tuan truoc/, -7, 'Tuần trước'], [/tuan sau|tuan toi/, 7, 'Tuần sau'], [/tuan nay/, 0, 'Tuần này']]) {
    if (pattern.test(q)) { const from = plusDays(weekStart(today), offset); return { from, to: plusDays(from, 6), label }; }
  }
  const offset = /hom qua|bua qua/.test(q) ? -1 : /ngay kia/.test(q) ? 2 : /\bmai\b/.test(q) ? 1 : 0;
  const day = plusDays(today, offset);
  return { from: day, to: day, label: offset === -1 ? 'Hôm qua' : offset === 1 ? 'Ngày mai' : offset === 2 ? 'Ngày kia' : 'Hôm nay' };
}

// Data mode only handles periods it actually queries.
function timChuDe(text) {
  const q = chuanHoa(text);
  // A specific date must be interpreted by AI, never silently replaced with today.
  if (/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/.test(q)) return [];
  // Bypass data mode for queries regarding admissions, universities, or external advice:
  if (/diem chuan|diem trung tuyen|diem xet tuyen|diem san|tuyen sinh|dai hoc|cao dang|truong |thi tot nghiep|on thi|nganh hoc|khoi thi/.test(q)) return [];
  if (/tu van|goi y|ke hoach|lam sao|nen |cach |huong dan|ra sao|the nao|\b(?:nhap|them|sua|xoa|quet)\b|muc tieu|tiet kiem|thang truoc|thang sau|nam ngoai|thang \d|thang mot|thang hai|thang ba/.test(q)) return [];
  const historical = /hom qua|bua qua|ngay kia|tuan truoc|tuan sau|tuan toi|tuan nay/.test(q);
  if (historical) return /lich|hoc/.test(q) ? ['lichHoc'] : [];
  const topics = [];
  if (/\bgpa\b|mon nguy co|\bdiem (?:mon|hoc|tich luy|trung binh|cua toi|tong ket)\b|\bbang diem\b|\bdiem so\b/.test(q) || (/diem/.test(q) && !/chuan|san|tuyen|thi/.test(q))) topics.push('hocTap');
  if (/deadline|han chot|qua han|cong viec/.test(q)) topics.push('deadline');
  if (/thu chi|chi tieu|chi bao nhieu|tong chi|tong thu|thu nhap|so du|ngan sach|tai chinh/.test(q)) topics.push('taiChinh');
  if (/lich hoc|thoi khoa bieu|hoc (?:mon )?(?:gi|di|nao)|(?:mai|hom nay) .*?(?:hoc|lich)|(?:mai|hom nay) (?:hoc|lich)/.test(q)) topics.push('lichHoc');
  return topics;
}

function vietnamDateOnly(date) {
  const p = vietnamParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function tongHopTaiChinhLichSu(allTransactions, labels) {
  if (!Array.isArray(allTransactions) || !allTransactions.length) {
    return {
      toanThoiGian: { tongThu: 0, tongChi: 0, soDu: 0, soGiaoDich: 0, tuNgay: null, denNgay: null },
      theoNam: [],
      cacThangCoGiaoDich: [],
    };
  }
  const byYear = new Map();
  const byMonth = new Map();
  let minDay = null;
  let maxDay = null;
  for (const tx of allTransactions) {
    const p = vietnamParts(tx.ngayGiaoDich);
    const day = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    if (!minDay || day < minDay) minDay = day;
    if (!maxDay || day > maxDay) maxDay = day;
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year).push(tx);
    const monthKey = `${p.year}-${String(p.month).padStart(2, '0')}`;
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, { thang: p.month, nam: p.year, list: [], chiCat: new Map() });
    const entry = byMonth.get(monthKey);
    entry.list.push(tx);
    if (tx.loai === 'chi') {
      const catName = labels[tx.danhMuc] || 'Khác';
      entry.chiCat.set(catName, (entry.chiCat.get(catName) || 0) + Number(tx.soTien || 0));
    }
  }
  const overall = thongKeTaiChinhService(allTransactions);
  const theoNam = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([nam, list]) => {
      const s = thongKeTaiChinhService(list);
      return { nam, tongThu: s.tongThu, tongChi: s.tongChi, soDu: s.soDu, soGiaoDich: list.length };
    });
  const cacThangCoGiaoDich = [...byMonth.values()]
    .sort((a, b) => (b.nam - a.nam) || (b.thang - a.thang))
    .slice(0, 36)
    .map(m => {
      const s = thongKeTaiChinhService(m.list);
      return {
        thang: m.thang,
        nam: m.nam,
        tongThu: s.tongThu,
        tongChi: s.tongChi,
        soDu: s.soDu,
        soGiaoDich: m.list.length,
        chiTheoDanhMuc: [...m.chiCat.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([danhMuc, soTien]) => ({ danhMuc, soTien })),
      };
    });
  return {
    toanThoiGian: { tongThu: overall.tongThu, tongChi: overall.tongChi, soDu: overall.soDu, soGiaoDich: allTransactions.length, tuNgay: minDay || vietnamDateOnly(allTransactions[0].ngayGiaoDich), denNgay: maxDay || vietnamDateOnly(allTransactions[0].ngayGiaoDich) },
    theoNam,
    cacThangCoGiaoDich,
  };
}

// All reads use the authenticated user. No raw transactions, email, password, IDs or notes enter the AI summary.
async function layDuLieuSinhVien(userId, topics = CHU_DE, now = new Date()) {
  const vn = vietnamParts(now);
  const { from, to } = monthRange(vn.month, vn.year);
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + CHATBOT.CONTEXT_DEADLINE_DAYS * 86400000);
  const result = { capNhatLuc: now.toISOString(), muiGio: 'Asia/Ho_Chi_Minh', phamVi: 'GPA/deadline: tất cả học kỳ; thu/chi: tháng hiện tại kèm tổng hợp toàn thời gian, từng năm và các tháng có phát sinh giao dịch; lịch học: tuần trước, tuần này và tuần sau của kỳ đang học, có điều chỉnh theo ngày. Lịch dự kiến, không phải điểm danh.' };
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
    const base = { idNguoiDung: userId, xoaLuc: null, trangThai: { not: 'hoan_thanh' } };
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
    const [groups, budgets, labels, allTransactions] = await Promise.all([
      prisma.giaoDich.groupBy({ by: ['loai', 'danhMuc'], where: { idNguoiDung: userId, ngayGiaoDich: { gte: from, lt: to } }, _sum: { soTien: true }, _count: { _all: true } }),
      prisma.nganSach.findMany({ where: { idNguoiDung: userId, thang: vn.month, nam: vn.year }, select: { danhMuc: true, soTienToiDa: true } }),
      categoryLabels(userId),
      typeof prisma.giaoDich.findMany === 'function'
        ? prisma.giaoDich.findMany({
          where: { idNguoiDung: userId },
          select: { loai: true, danhMuc: true, soTien: true, ngayGiaoDich: true },
          orderBy: { ngayGiaoDich: 'desc' },
        })
        : [],
    ]);
    const transactions = groups.map(g => ({ loai: g.loai, danhMuc: g.danhMuc, soTien: g._sum.soTien || 0 }));
    const { tongThu, tongChi, soDu } = thongKeTaiChinhService(transactions);
    const hasHistory = Array.isArray(allTransactions) && allTransactions.length > 0;
    result.taiChinh = {
      thang: vn.month, nam: vn.year, tongThu, tongChi, soDu, soGiaoDich: groups.reduce((sum, g) => sum + g._count._all, 0),
      nganSach: kiemTraNganSachService(budgets, transactions.filter(g => g.loai === 'chi')).map(b => ({ danhMuc: labels[b.danhMuc] || 'Khác', hanMuc: b.hanMuc, daChi: b.daChi, vuot: b.vuotNganSach })),
      ...(hasHistory ? tongHopTaiChinhLichSu(allTransactions, labels) : {}),
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
    const start = weekStart(today);
    const weeks = await Promise.all([-7, 0, 7].map(offset => loadWeek(prisma, userId, base, plusDays(start, offset))));
    const clean = c => ({ ngay: c.ngayHoc, mon: ngan(c.tenMon), batDau: c.gioBatDau, ketThuc: c.gioKetThuc, phong: ngan(c.phongHoc), hocKy: ngan(c.hocKy) });
    const all = weeks.flatMap(w => w.thoiKhoaBieu).map(clean);
    result.lichHoc = { hocKy: ngan(hocKy), tuNgay: weeks[0].tuNgay, denNgay: weeks[2].denNgay, lich: all.slice(0, 150), biGioiHan: all.length > 150, homNay: all.filter(c => c.ngay === today), ngayMai: all.filter(c => c.ngay === next) };
  })());
  await Promise.all(jobs);
  return result;
}

function formatChiDanhMuc(list) {
  if (!list?.length) return '';
  return ' Chi theo danh mục: ' + list.map(c => c.danhMuc + ' ' + formatTien(c.soTien)).join(', ') + '.';
}

function answerFinanceData(f, q) {
  const parts = [];
  const monthMatch = /\b(?:thang|t)\s*(1[0-2]|0?[1-9])(?:\s*[\/-]\s*(20\d{2}|19\d{2}))?\b/.exec(q);
  const yearOnlyMatch = /\b(?:nam\s+)?(20\d{2}|19\d{2})\b/.exec(q);
  const wantsPrevMonth = /thang truoc/.test(q);
  const wantsLastYear = /nam ngoai/.test(q);
  const wantsAllTime = /toan bo|tat ca|toan thoi gian|lich su|cac nam|tu truoc|tong hop/.test(q);

  if (monthMatch || wantsPrevMonth) {
    let targetMonth = wantsPrevMonth ? (f.thang === 1 ? 12 : f.thang - 1) : Number(monthMatch[1]);
    let targetYear = wantsPrevMonth ? (f.thang === 1 ? f.nam - 1 : f.nam) : (monthMatch[2] ? Number(monthMatch[2]) : (yearOnlyMatch ? Number(yearOnlyMatch[1]) : null));
    const matches = (f.cacThangCoGiaoDich || []).filter(m => m.thang === targetMonth && (targetYear ? m.nam === targetYear : true));
    if (matches.length) {
      for (const m of matches.slice(0, 3)) {
        parts.push('**Thu/chi tháng ' + m.thang + '/' + m.nam + '** (' + m.soGiaoDich + ' giao dịch)');
        parts.push('Thu: ' + formatTien(m.tongThu) + ' · Chi: ' + formatTien(m.tongChi) + ' · Số dư: **' + formatTien(m.soDu) + '**.' + formatChiDanhMuc(m.chiTheoDanhMuc));
      }
      return parts;
    }
    const label = targetMonth + (targetYear ? '/' + targetYear : '');
    parts.push('Chưa có giao dịch nào trong tháng ' + label + '.');
    if (f.cacThangCoGiaoDich?.length) {
      parts.push('Các tháng có dữ liệu: ' + f.cacThangCoGiaoDich.slice(0, 6).map(m => 'T' + m.thang + '/' + m.nam).join(', ') + '.');
    }
    return parts;
  }

  if (yearOnlyMatch || wantsLastYear) {
    const targetYear = wantsLastYear ? f.nam - 1 : Number(yearOnlyMatch[1]);
    const yearSummary = (f.theoNam || []).find(y => y.nam === targetYear);
    if (yearSummary) {
      parts.push('**Thu/chi năm ' + yearSummary.nam + '** (' + yearSummary.soGiaoDich + ' giao dịch)');
      parts.push('Thu: ' + formatTien(yearSummary.tongThu) + ' · Chi: ' + formatTien(yearSummary.tongChi) + ' · Số dư: **' + formatTien(yearSummary.soDu) + '**.');
      const monthsInYear = (f.cacThangCoGiaoDich || []).filter(m => m.nam === targetYear);
      if (monthsInYear.length) {
        parts.push('Chi tiết các tháng: ' + monthsInYear.map(m => 'T' + m.thang + ' (Thu ' + formatTien(m.tongThu) + ', Chi ' + formatTien(m.tongChi) + ')').join('; ') + '.');
      }
      return parts;
    }
    parts.push('Chưa có giao dịch nào trong năm ' + targetYear + '.');
    if (f.theoNam?.length) {
      parts.push('Các năm có dữ liệu: ' + f.theoNam.map(y => y.nam).join(', ') + '.');
    }
    return parts;
  }

  const asksCurrentMonthOnly = /\bthang nay\b/.test(q);
  const hasOtherPeriodTx = (f.toanThoiGian?.soGiaoDich || 0) > (f.soGiaoDich || 0);

  if (!wantsAllTime || !f.toanThoiGian?.soGiaoDich) {
    parts.push('**Thu/chi tháng ' + f.thang + '/' + f.nam + '**', 'Thu: ' + formatTien(f.tongThu) + ' · Chi: ' + formatTien(f.tongChi), 'Số dư trong tháng: **' + formatTien(f.soDu) + '** (thu trừ chi).');
    if (!f.soGiaoDich) parts.push('Chưa có giao dịch trong tháng này.');
  }
  if ((wantsAllTime || !f.soGiaoDich || (!asksCurrentMonthOnly && hasOtherPeriodTx)) && f.toanThoiGian?.soGiaoDich) {
    const all = f.toanThoiGian;
    parts.push('**Tổng hợp toàn bộ thời gian** (' + all.soGiaoDich + ' giao dịch' + (all.tuNgay && all.denNgay ? ', từ ' + all.tuNgay + ' đến ' + all.denNgay : '') + ')');
    parts.push('Thu: ' + formatTien(all.tongThu) + ' · Chi: ' + formatTien(all.tongChi) + ' · Số dư: **' + formatTien(all.soDu) + '**');
    if (f.theoNam?.length) {
      parts.push('Theo năm: ' + f.theoNam.map(y => y.nam + ' (Thu ' + formatTien(y.tongThu) + ', Chi ' + formatTien(y.tongChi) + ', ' + y.soGiaoDich + ' GD)').join('; ') + '.');
    }
    if (f.cacThangCoGiaoDich?.length) {
      parts.push('Các tháng có giao dịch gần nhất: ' + f.cacThangCoGiaoDich.slice(0, 12).map(m => 'T' + m.thang + '/' + m.nam + ' (Thu ' + formatTien(m.tongThu) + ', Chi ' + formatTien(m.tongChi) + ')').join('; ') + '.');
    }
  }
  if (/ngan sach/.test(q)) parts.push(f.nganSach.length ? f.nganSach.map(b => '- ' + b.danhMuc + ': đã chi ' + formatTien(b.daChi) + '/' + formatTien(b.hanMuc) + (b.vuot ? ' — vượt ngân sách' : '')).join('\n') : 'Bạn chưa đặt ngân sách tháng này.');
  return parts;
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
    parts.push(...answerFinanceData(data.taiChinh, chuanHoa(text)));
  }
  if (data.lichHoc) {
    const period = khoangLich(text, new Date(data.capNhatLuc));
    const title = period.label;
    const classes = (data.lichHoc.lich || []).filter(c => c.ngay >= period.from && c.ngay <= period.to);
    parts.push(classes.length ? '**' + title + ': ' + classes.length + ' buổi học**\n' + classes.map(c => '- ' + c.ngay.split('-').reverse().join('/') + ' · ' + c.batDau + '–' + c.ketThuc + ': ' + c.mon + (c.phong ? ' · ' + c.phong : '') + (c.hocKy ? ' · ' + c.hocKy : '')).join('\n') : title + ' chưa có buổi học nào trong lịch đã nhập.');
    if (data.lichHoc.biGioiHan) parts.push('Danh sách được giới hạn 150 buổi; mở Lịch học để xem đầy đủ.');
    if (/hom qua|tuan truoc/.test(chuanHoa(text))) parts.push('Đây là lịch dự kiến theo dữ liệu hiện có, không xác nhận bạn đã tham gia buổi học.');
    parts.push((data.lichHoc.hocKy ? 'Học kỳ đang học: ' + data.lichHoc.hocKy + ', gồm lịch dùng chung.' : 'Chưa chọn học kỳ đang học; đang xem tất cả học kỳ.') + ' Đã tính các buổi nghỉ và đổi lịch theo ngày.');
  }
  return parts.join('\n');
}
module.exports = { layDuLieuSinhVien, timChuDe, traLoiDuLieu, layThuTrongTuan, formatTien };
