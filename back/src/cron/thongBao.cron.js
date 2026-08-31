const cron = require('node-cron');
const prisma = require('../prismaClient');
const { guiEmail } = require('../utils/email.util');

// CN32: Email nhắc deadline sắp hết hạn trong 24h tới.
// Chạy mỗi ngày lúc 07:00 sáng (giờ server).
async function nhacDeadlineQuaEmail() {
  try {
    const now = new Date();
    const gioiHan = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const deadlines = await prisma.deadline.findMany({
      where: {
        trangThai: 'dang_dien_hanh',
        hanChot: { gte: now, lte: gioiHan },
      },
      include: { nguoiDung: true, monHoc: true },
      orderBy: { hanChot: 'asc' },
    });

    if (deadlines.length === 0) {
      console.log('[Cron] Không có deadline nào sắp hết hạn trong 24h tới.');
      return;
    }

    // Gom deadline theo từng người dùng để gửi 1 email tổng hợp thay vì nhiều email lẻ
    const theoNguoiDung = {};
    deadlines.forEach((d) => {
      if (!theoNguoiDung[d.idNguoiDung]) {
        theoNguoiDung[d.idNguoiDung] = { nguoiDung: d.nguoiDung, deadlines: [] };
      }
      theoNguoiDung[d.idNguoiDung].deadlines.push(d);
    });

    for (const idNguoiDung of Object.keys(theoNguoiDung)) {
      const { nguoiDung, deadlines: ds } = theoNguoiDung[idNguoiDung];

      const danhSachHtml = ds
        .map(
          (d) => `
            <li style="margin-bottom:8px;">
              <strong>${d.tieuDe}</strong>${d.monHoc ? ` (${d.monHoc.ten})` : ''}<br/>
              Hạn chót: ${new Date(d.hanChot).toLocaleString('vi-VN')}
            </li>`
        )
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#2563eb;">Student Life Hub</h2>
          <p>Xin chào <strong>${nguoiDung.ten}</strong>,</p>
          <p>Bạn có <strong>${ds.length}</strong> deadline sắp hết hạn trong 24 giờ tới:</p>
          <ul>${danhSachHtml}</ul>
          <p>Hãy vào ứng dụng để kiểm tra và hoàn thành đúng hạn nhé!</p>
        </div>
      `;

      try {
        await guiEmail({
          to: nguoiDung.email,
          subject: `⏰ Bạn có ${ds.length} deadline sắp hết hạn - Student Life Hub`,
          html,
        });
        console.log(`[Cron] Đã gửi email nhắc deadline cho ${nguoiDung.email}`);
      } catch (err) {
        console.error(`[Cron] Gửi email thất bại cho ${nguoiDung.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Cron] Lỗi khi chạy nhacDeadlineQuaEmail:', error);
  }
}

// CN33: Email cảnh báo vượt ngân sách trong tháng hiện tại.
// Chạy mỗi ngày lúc 08:00 sáng (giờ server).
async function canhBaoNganSachQuaEmail() {
  try {
    const now = new Date();
    const thang = now.getMonth() + 1;
    const nam = now.getFullYear();

    const nganSachs = await prisma.nganSach.findMany({
      where: { thang, nam },
      include: { nguoiDung: true },
    });

    if (nganSachs.length === 0) {
      console.log('[Cron] Không có ngân sách nào được đặt cho tháng này.');
      return;
    }

    const from = new Date(nam, thang - 1, 1);
    const to = new Date(nam, thang, 1);

    // Gom theo người dùng để tính chi tiêu 1 lần cho mỗi người
    const theoNguoiDung = {};
    nganSachs.forEach((ns) => {
      if (!theoNguoiDung[ns.idNguoiDung]) {
        theoNguoiDung[ns.idNguoiDung] = { nguoiDung: ns.nguoiDung, nganSachs: [] };
      }
      theoNguoiDung[ns.idNguoiDung].nganSachs.push(ns);
    });

    for (const idNguoiDung of Object.keys(theoNguoiDung)) {
      const { nguoiDung, nganSachs: dsNganSach } = theoNguoiDung[idNguoiDung];

      const giaoDichs = await prisma.giaoDich.findMany({
        where: { idNguoiDung: parseInt(idNguoiDung), loai: 'chi', ngayGiaoDich: { gte: from, lt: to } },
      });

      const vuot = dsNganSach
        .map((ns) => {
          const daChi = giaoDichs
            .filter((g) => g.danhMuc === ns.danhMuc)
            .reduce((sum, g) => sum + g.soTien, 0);
          return { danhMuc: ns.danhMuc, soTienToiDa: ns.soTienToiDa, daChi };
        })
        .filter((ns) => ns.daChi > ns.soTienToiDa);

      if (vuot.length === 0) continue;

      const danhSachHtml = vuot
        .map(
          (ns) => `
            <li style="margin-bottom:8px;">
              <strong>${ns.danhMuc.replace('_', ' ')}</strong>: đã chi
              ${ns.daChi.toLocaleString('vi-VN')}đ / hạn mức ${ns.soTienToiDa.toLocaleString('vi-VN')}đ
            </li>`
        )
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#ea580c;">Student Life Hub</h2>
          <p>Xin chào <strong>${nguoiDung.ten}</strong>,</p>
          <p>Bạn đã <strong>vượt hạn mức ngân sách</strong> ở ${vuot.length} danh mục trong tháng ${thang}/${nam}:</p>
          <ul>${danhSachHtml}</ul>
          <p>Hãy vào ứng dụng để xem chi tiết và điều chỉnh chi tiêu nhé!</p>
        </div>
      `;

      try {
        await guiEmail({
          to: nguoiDung.email,
          subject: `💸 Cảnh báo vượt ngân sách - Student Life Hub`,
          html,
        });
        console.log(`[Cron] Đã gửi email cảnh báo ngân sách cho ${nguoiDung.email}`);
      } catch (err) {
        console.error(`[Cron] Gửi email thất bại cho ${nguoiDung.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Cron] Lỗi khi chạy canhBaoNganSachQuaEmail:', error);
  }
}

// Khởi động các cron job. Gọi hàm này 1 lần khi server start (trong app.js).
function khoiDongCronJobs() {
  // Mỗi ngày lúc 07:00 - nhắc deadline sắp hết hạn (CN32)
  cron.schedule('0 7 * * *', nhacDeadlineQuaEmail);

  // Mỗi ngày lúc 08:00 - cảnh báo vượt ngân sách (CN33)
  cron.schedule('0 8 * * *', canhBaoNganSachQuaEmail);

  console.log('[Cron] Đã khởi động lịch nhắc deadline (07:00) và cảnh báo ngân sách (08:00) mỗi ngày.');
}

module.exports = { khoiDongCronJobs, nhacDeadlineQuaEmail, canhBaoNganSachQuaEmail };
