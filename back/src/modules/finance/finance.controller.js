const { readPeriod, monthRange, vietnamParts, parseVietnamDate } = require('../../utils/date.util');
const prisma = require('../../prismaClient');
const { tongHopGiaoDich } = require('./finance.repository');
const ExcelJS = require('exceljs');
const { FINANCE } = require('../../constants');
const { httpError } = require('../../utils/transaction.util');
const { validDong } = require('../../utils/money.util');
const { finiteNumber } = require('../../utils/number.util');
const { validText } = require('../../utils/validation.util');
const {
  chongCongThuc,
  thongKeTaiChinhService,
  kiemTraNganSachService,
} = require('./finance.service');

const { validCategory, categoryLabels } = require('./category.service');

// ===== GIAO DỊCH =====

// Thêm giao dịch mới
async function themGiaoDich(req, res) {
  try {
    const { loai, danhMuc, soTien, moTa, ngayGiaoDich, anhHoaDonHash, choPhepTrungHoaDon } = req.body;
    if (moTa != null && !validText(moTa, 5000, false)) return res.status(400).json({ message: 'Mô tả phải là văn bản không quá 5000 ký tự.' });
    const idNguoiDung = req.user.id;

    if (!loai || !danhMuc || soTien === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ loại, danh mục, số tiền' });
    }
    if (!['thu', 'chi'].includes(loai)) {
      return res.status(400).json({ message: 'Loại giao dịch không hợp lệ (chỉ nhận "thu" hoặc "chi")' });
    }
    if (!await validCategory(idNguoiDung, danhMuc, loai)) return res.status(400).json({message:'Danh mục thu/chi không hợp lệ.'});
    if (!validDong(soTien)) {
      return res.status(400).json({ message: 'Số tiền phải là số nguyên từ 1 đến 1.000.000.000.000 đồng.' });
    }
    if (ngayGiaoDich !== undefined && isNaN(parseVietnamDate(ngayGiaoDich).getTime())) {
      return res.status(400).json({ message: 'Ngày giao dịch không hợp lệ' });
    }

    if(anhHoaDonHash!==undefined&&(typeof anhHoaDonHash!=='string'||! /^[a-f0-9]{64}$/.test(anhHoaDonHash)))return res.status(400).json({message:'Mã ảnh hóa đơn không hợp lệ.'});
    if(choPhepTrungHoaDon!==undefined&&typeof choPhepTrungHoaDon!=='boolean')return res.status(400).json({message:'Xác nhận hóa đơn không hợp lệ.'});
    const create=client=>client.giaoDich.create({
      data: {
        loai,
        danhMuc,
        anhHoaDonHash,
        soTien: finiteNumber(soTien),
        moTa,
        ngayGiaoDich: ngayGiaoDich ? parseVietnamDate(ngayGiaoDich) : undefined,
        idNguoiDung,
      },
    });

    const giaoDich = anhHoaDonHash ? await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "NguoiDung" WHERE id = ${idNguoiDung} FOR UPDATE`;
      const candidates=[{anhHoaDonHash}];
      if(loai==='chi'&&typeof moTa==='string'&&moTa.trim().length>=3&&moTa.trim().toLocaleLowerCase('vi')!=='hóa đơn'){
        const p=vietnamParts(ngayGiaoDich?parseVietnamDate(ngayGiaoDich):new Date());
        const from=new Date(Date.UTC(p.year,p.month-1,p.day)-7*3600000),to=new Date(from.getTime()+86400000);
        candidates.push({loai,soTien:finiteNumber(soTien),moTa:{equals:moTa.trim(),mode:'insensitive'},ngayGiaoDich:{gte:from,lt:to}});
      }
      if(!choPhepTrungHoaDon && await tx.giaoDich.findFirst({where:{idNguoiDung,OR:candidates},select:{id:true}}))throw Object.assign(httpError(409,'Đã có giao dịch cùng ảnh, hoặc cùng mô tả, ngày và số tiền. Kiểm tra lại trước khi ghi thêm một khoản riêng.'),{code:'RECEIPT_DUPLICATE'});
      return create(tx);
    }) : await create(prisma);
    res.status(201).json({ message: 'Thêm giao dịch thành công', giaoDich });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Lấy danh sách giao dịch (lọc theo tháng/năm, tìm kiếm, phân trang nếu có)
async function layDanhSachGiaoDich(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam, q, loai, danhMuc, trang, soLuong } = req.query;
    if ((q !== undefined && !validText(q, 200, false)) || (loai !== undefined && !['thu', 'chi'].includes(loai)) || (danhMuc !== undefined && !await validCategory(idNguoiDung,danhMuc))) return res.status(400).json({ message: 'Bộ lọc giao dịch không hợp lệ.' });

    const where = { idNguoiDung };

    if (thang !== undefined || nam !== undefined) {
      const { from, to } = readPeriod(req.query, true);
      where.ngayGiaoDich = { gte: from, lt: to };
    }

    if (loai) {
      where.loai = loai;
    }

    if (danhMuc) {
      where.danhMuc = danhMuc;
    }

    if (q) {
      const fold=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
      const labels=await categoryLabels(idNguoiDung);
      const codes=[];for(const type of ['chi','thu'])for(const code of Object.keys(labels).filter(key=>!key.includes(':'))){if(fold(labels[type+':'+code]||labels[code]).includes(fold(q)))codes.push({loai:type,danhMuc:code});}
      where.OR = [
        { moTa: { contains: q, mode: 'insensitive' } },
        ...codes,
        { danhMuc: { contains: q, mode: 'insensitive' } },
      ];
    }

    if ((trang !== undefined && !/^[1-9]\d*$/.test(String(trang))) || (soLuong !== undefined && !/^[1-9]\d*$/.test(String(soLuong)))) return res.status(400).json({ message: 'Trang và số lượng phải là số nguyên dương' });
    if (trang !== undefined && (!Number.isSafeInteger(Number(trang)) || Number(trang) > 21474836)) return res.status(400).json({ message: 'Số trang vượt giới hạn.' });
    const trangSo = Math.max(Number(trang) || 1, 1);
    const kichThuoc = Math.min(Math.max(parseInt(soLuong) || FINANCE.DEFAULT_PAGE_SIZE, 1), FINANCE.MAX_PAGE_SIZE);

    const [danhSach, tongSo] = await Promise.all([
      prisma.giaoDich.findMany({
        where,
        orderBy: [{ ngayGiaoDich: 'desc' }, { id: 'desc' }],
        skip: (trangSo - 1) * kichThuoc,
        take: kichThuoc,
      }),
      prisma.giaoDich.count({ where }),
    ]);

    res.json({
      giaoDichs: danhSach,
      tongSo,
      trang: trangSo,
      soTrang: Math.max(Math.ceil(tongSo / kichThuoc), 1),
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Sửa giao dịch
async function suaGiaoDich(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { loai, danhMuc, soTien, moTa, ngayGiaoDich, anhHoaDonHash, choPhepTrungHoaDon } = req.body;
    if (moTa != null && !validText(moTa, 5000, false)) return res.status(400).json({ message: 'Mô tả phải là văn bản không quá 5000 ký tự.' });

    if (loai !== undefined && !['thu', 'chi'].includes(loai)) {
      return res.status(400).json({ message: 'Loại giao dịch không hợp lệ (chỉ nhận "thu" hoặc "chi")' });
    }
    if (danhMuc !== undefined && !await validCategory(idNguoiDung,danhMuc)) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }
    if (soTien !== undefined && (!validDong(soTien))) {
      return res.status(400).json({ message: 'Số tiền phải là số nguyên từ 1 đến 1.000.000.000.000 đồng.' });
    }
    if (ngayGiaoDich !== undefined && (typeof ngayGiaoDich !== 'string' || !ngayGiaoDich.trim() || isNaN(parseVietnamDate(ngayGiaoDich).getTime()))) {
      return res.status(400).json({ message: 'Ngày giao dịch không hợp lệ' });
    }

    const hienTai = await prisma.giaoDich.findFirst({ where: { id: parseInt(id), idNguoiDung } });
    if (!hienTai) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa' });
    }
    const loaiMoi = loai ?? hienTai.loai;
    const danhMucMoi = danhMuc ?? hienTai.danhMuc;
    if (!await validCategory(idNguoiDung,danhMucMoi,loaiMoi)) {
      return res.status(400).json({ message: 'Vui lòng chọn danh mục chi tiêu phù hợp' });
    }

    const ketQua = await prisma.giaoDich.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        loai,
        danhMuc,
        soTien: soTien !== undefined ? finiteNumber(soTien) : undefined,
        moTa,
        ngayGiaoDich: ngayGiaoDich !== undefined ? parseVietnamDate(ngayGiaoDich) : undefined,
      },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa' });
    }

    const giaoDich = await prisma.giaoDich.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Cập nhật thành công', giaoDich });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Xóa giao dịch
async function xoaGiaoDich(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.giaoDich.deleteMany({ where: { id: parseInt(id), idNguoiDung } });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền xóa' });
    }
    res.json({ message: 'Xóa giao dịch thành công' });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Thống kê chi tiêu theo danh mục trong tháng
async function thongKeTheoThang(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam } = readPeriod(req.query);

    const { from, to } = monthRange(thang, nam);

    const giaoDichs = await tongHopGiaoDich({ idNguoiDung, ngayGiaoDich: { gte: from, lt: to } });

    const { tongThu, tongChi, soDu, theoDanhMuc } = thongKeTaiChinhService(giaoDichs);

    res.json({
      thang,
      nam,
      tongThu,
      tongChi,
      soDu,
      theoDanhMuc,
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// ===== NGÂN SÁCH =====

// Đặt ngân sách cho 1 danh mục trong tháng
async function datNganSach(req, res) {
  try {
    const { danhMuc, soTienToiDa, thang, nam } = req.body;
    const idNguoiDung = req.user.id;

    if (!danhMuc || soTienToiDa === undefined || !thang || !nam) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin ngân sách' });
    }
    if (!await validCategory(idNguoiDung,danhMuc,'chi')) {
      return res.status(400).json({ message: 'Danh mục ngân sách không hợp lệ (ngân sách chỉ áp dụng cho chi tiêu)' });
    }
    if (!validDong(soTienToiDa)) {
      return res.status(400).json({ message: 'Hạn mức phải là số nguyên từ 1 đến 1.000.000.000.000 đồng.' });
    }
    if (!Number.isInteger(finiteNumber(thang)) || finiteNumber(thang) < 1 || finiteNumber(thang) > 12) {
      return res.status(400).json({ message: 'Tháng không hợp lệ (phải từ 1 đến 12)' });
    }
    if (!Number.isInteger(finiteNumber(nam)) || finiteNumber(nam) < 1000 || finiteNumber(nam) > 9999) {
      return res.status(400).json({ message: 'Năm phải là số nguyên từ 1000 đến 9999' });
    }

    const amount = finiteNumber(soTienToiDa);
    const month = finiteNumber(thang);
    const year = finiteNumber(nam);
    const nganSach = await prisma.nganSach.upsert({
      where: { idNguoiDung_danhMuc_thang_nam: { idNguoiDung, danhMuc, thang: month, nam: year } },
      create: { danhMuc, soTienToiDa: amount, thang: month, nam: year, idNguoiDung },
      update: { soTienToiDa: amount },
    });
    res.status(200).json({ message: 'Đã lưu ngân sách', nganSach });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Kiểm tra tình trạng ngân sách (so sánh với chi tiêu thực tế)
async function kiemTraNganSach(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam } = readPeriod(req.query);

    const nganSachs = await prisma.nganSach.findMany({
      where: { idNguoiDung, thang, nam },
    });

    const { from, to } = monthRange(thang, nam);

    const giaoDichs = await tongHopGiaoDich({ idNguoiDung, loai: 'chi', ngayGiaoDich: { gte: from, lt: to } });

    const ketQua = kiemTraNganSachService(nganSachs, giaoDichs);

    res.json({ thang, nam, ketQua });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// Xu hướng thu/chi trong N tháng gần nhất
async function xuHuongNThang(req, res) {
  try {
    const idNguoiDung = req.user.id;
    // Giới hạn soThang trong khoảng [1, 24]
    const soThang = Math.min(Math.max(parseInt(req.query.soThang) || FINANCE.DEFAULT_TREND_MONTHS, 1), 24);
    const { thang: endMonth, nam: endYear } = readPeriod(req.query, true);

    // Tính khoảng thời gian bao phủ toàn bộ N tháng
    const from = monthRange(endMonth - (soThang - 1), endYear).from;
    const to = monthRange(endMonth, endYear).to;

    // 1 query duy nhất thay vì N queries tuần tự
    const giaoDichs = await prisma.giaoDich.findMany({
      where: { idNguoiDung, ngayGiaoDich: { gte: from, lt: to } },
      select: { loai: true, soTien: true, ngayGiaoDich: true },
    });

    // Tạo map kết quả khởi tạo sẵn cho tất cả N tháng
    const thangMap = {};
    for (let i = soThang - 1; i >= 0; i--) {
      const thoiDiem = new Date(Date.UTC(endYear, endMonth - 1 - i, 15));
      const thang = thoiDiem.getUTCMonth() + 1;
      const nam = thoiDiem.getUTCFullYear();
      thangMap[`${thang}/${nam}`] = { thang: `${thang}/${nam}`, thu: 0, chi: 0 };
    }

    // Gom nhóm trong bộ nhớ
    giaoDichs.forEach((g) => {
      const d = new Date(g.ngayGiaoDich);
      const part = vietnamParts(d);
      const key = `${part.month}/${part.year}`;
      if (thangMap[key]) {
        if (g.loai === 'thu') thangMap[key].thu += g.soTien;
        else thangMap[key].chi += g.soTien;
      }
    });

    res.json({ xuHuong: Object.values(thangMap) });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Lỗi server', ...(error.code==='RECEIPT_DUPLICATE'?{code:error.code}:{}) });
  }
}

// CN37 - Xuất báo cáo tài chính ra file Excel (.xlsx)
// Query optional: ?thang=8&nam=2026 (không truyền thì xuất toàn bộ giao dịch)
async function xuatBaoCaoTaiChinhExcel(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam } = req.query;

    const where = { idNguoiDung };
    if (thang !== undefined || nam !== undefined) {
      const { from, to } = readPeriod(req.query, true);
      where.ngayGiaoDich = { gte: from, lt: to };
    }

    const giaoDichs = await prisma.giaoDich.findMany({
      where,
      orderBy: [{ ngayGiaoDich: 'asc' }, { id: 'asc' }],
      // Giới hạn an toàn tải dữ liệu vào bộ nhớ khi xuất file
      take: FINANCE.MAX_EXPORT_RECORDS + 1,
    });

    if (giaoDichs.length > FINANCE.MAX_EXPORT_RECORDS) return res.status(400).json({ message: 'Báo cáo vượt giới hạn 10.000 giao dịch. Hãy chọn một tháng có ít giao dịch hơn.' });
    const labels = await categoryLabels(idNguoiDung);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Life Hub';
    workbook.created = new Date();

    // Sheet 1: Chi tiết giao dịch
    const sheet1 = workbook.addWorksheet('Chi tiết giao dịch');
    sheet1.columns = [
      { header: 'Ngày', key: 'ngay', width: 14 },
      { header: 'Loại', key: 'loai', width: 12 },
      { header: 'Danh mục', key: 'danhMuc', width: 20 },
      { header: 'Mô tả', key: 'moTa', width: 30 },
      { header: 'Số tiền', key: 'soTien', width: 16 },
    ];
    sheet1.getRow(1).font = { bold: true };

    let tongThu = 0;
    let tongChi = 0;
    giaoDichs.forEach((gd) => {
      sheet1.addRow({
        ngay: new Date(gd.ngayGiaoDich).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        loai: gd.loai === 'thu' ? 'Thu nhập' : 'Chi tiêu',
        danhMuc: chongCongThuc(labels[gd.loai+':'+gd.danhMuc] || labels[gd.danhMuc] || gd.danhMuc),
        moTa: chongCongThuc(gd.moTa || ''),
        soTien: gd.soTien,
      });
      if (gd.loai === 'thu') tongThu += gd.soTien;
      else if (gd.loai === 'chi') tongChi += gd.soTien;
    });
    sheet1.getColumn('soTien').numFmt = '#,##0" đ"';

    // Sheet 2: Tổng hợp theo danh mục
    const sheet2 = workbook.addWorksheet('Tổng hợp theo danh mục');
    sheet2.columns = [
      { header: 'Danh mục', key: 'danhMuc', width: 24 },
      { header: 'Loại', key: 'loai', width: 12 },
      { header: 'Tổng tiền', key: 'tong', width: 16 },
    ];
    sheet2.getRow(1).font = { bold: true };

    const theoDanhMuc = {};
    giaoDichs.forEach((gd) => {
      const key = `${gd.danhMuc}__${gd.loai}`;
      theoDanhMuc[key] = (theoDanhMuc[key] || 0) + gd.soTien;
    });
    Object.entries(theoDanhMuc).forEach(([key, tong]) => {
      const [danhMuc, loai] = key.split('__');
      sheet2.addRow({ danhMuc: chongCongThuc(labels[loai+':'+danhMuc] || labels[danhMuc] || danhMuc), loai: loai === 'thu' ? 'Thu nhập' : 'Chi tiêu', tong });
    });
    sheet2.getColumn('tong').numFmt = '#,##0" đ"';

    // Sheet 3: Tổng kết
    const sheet3 = workbook.addWorksheet('Tổng kết');
    sheet3.addRow(['Kỳ báo cáo', thang && nam ? `Tháng ${thang}/${nam}` : 'Toàn bộ']);
    sheet3.addRow(['Tổng thu', tongThu]);
    sheet3.addRow(['Tổng chi', tongChi]);
    sheet3.addRow(['Số dư', tongThu - tongChi]);
    sheet3.getColumn(1).width = 20;
    sheet3.getColumn(2).width = 20;
    sheet3.getColumn(2).numFmt = '#,##0" đ"';
    sheet3.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const tenFile = thang && nam ? `bao-cao-tai-chinh-${thang}-${nam}.xlsx` : 'bao-cao-tai-chinh.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename="${tenFile}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Không thể xuất báo cáo tài chính' });
  }
}


async function xoaNganSach(req,res) {
  try {
    const deleted=await prisma.nganSach.deleteMany({where:{id:Number(req.params.id),idNguoiDung:req.user.id}});
    if(!deleted.count)return res.status(404).json({message:'Không tìm thấy ngân sách của tài khoản.'});
    res.json({message:'Đã gỡ hạn mức. Các giao dịch được giữ nguyên.'});
  }catch{res.status(500).json({message:'Chưa gỡ được ngân sách.'});}
}

module.exports = {
  xoaNganSach,
  themGiaoDich,
  layDanhSachGiaoDich,
  suaGiaoDich,
  xoaGiaoDich,
  thongKeTheoThang,
  datNganSach,
  kiemTraNganSach,
  xuHuongNThang,
  xuatBaoCaoTaiChinhExcel,
};
