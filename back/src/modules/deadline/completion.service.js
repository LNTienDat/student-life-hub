const prisma = require('../../prismaClient');
const { serializable, httpError } = require('../../utils/transaction.util');
const DAY_MS = 86400000;

async function moveExpired(tx, idNguoiDung, now = new Date()) {
  return tx.deadline.updateMany({
    where: { idNguoiDung, xoaLuc: null, trangThai: 'hoan_thanh', hoanThanhLuc: { lte: new Date(now.getTime() - DAY_MS) } },
    data: { xoaLuc: now },
  });
}

async function updateActive(idNguoiDung, id, data) {
  return serializable(prisma, async tx => {
    const current = await tx.deadline.findFirst({ where: { id, idNguoiDung, xoaLuc: null } });
    if (!current) throw httpError(404, 'Không tìm thấy deadline hoặc bạn không có quyền sửa');
    const completion = data.trangThai === undefined ? {} : {
      hoanThanhLuc: data.trangThai === 'hoan_thanh' ? (current.hoanThanhLuc || new Date()) : null,
    };
    return tx.deadline.update({ where: { id }, data: { ...data, ...completion }, include: { monHoc: true } });
  });
}

async function readDeadlines(idNguoiDung, where) {
  return serializable(prisma, async tx => {
    const user = await tx.nguoiDung.findUniqueOrThrow({ where: { id: idNguoiDung }, select: { tuDongXoaDeadline: true } });
    if (user.tuDongXoaDeadline) await moveExpired(tx, idNguoiDung);
    const rows = await tx.deadline.findMany({ where, include: { monHoc: true }, orderBy: { hanChot: 'asc' } });
    return { deadlines: rows.filter(row => !row.xoaLuc), daXoa: rows.filter(row => row.xoaLuc), tuDongXoaDeadline: user.tuDongXoaDeadline };
  });
}

async function saveSettings(req, res) {
  if (typeof req.body.tuDongXoaDeadline !== 'boolean') return res.status(400).json({ message: 'Tùy chọn phải là bật hoặc tắt.' });
  try {
    await serializable(prisma, async tx => {
      const current = await tx.nguoiDung.findUniqueOrThrow({ where: { id: req.user.id }, select: { tuDongXoaDeadline: true } });
      if (current.tuDongXoaDeadline) await moveExpired(tx, req.user.id);
      await tx.nguoiDung.update({ where: { id: req.user.id }, data: { tuDongXoaDeadline: req.body.tuDongXoaDeadline } });
      if (req.body.tuDongXoaDeadline) await moveExpired(tx, req.user.id);
    });
    res.json({ tuDongXoaDeadline: req.body.tuDongXoaDeadline });
  } catch { res.status(500).json({ message: 'Chưa lưu được tùy chọn.' }); }
}

async function restore(req, res) {
  try {
    const result = await prisma.deadline.updateMany({ where: { id: Number(req.params.id), idNguoiDung: req.user.id, xoaLuc: { not: null } },
      data: { xoaLuc: null, hoanThanhLuc: null, trangThai: 'cho_xu_ly' } });
    if (!result.count) return res.status(404).json({ message: 'Không tìm thấy deadline đã xóa.' });
    res.json({ message: 'Đã khôi phục về chưa hoàn thành.' });
  } catch { res.status(500).json({ message: 'Chưa khôi phục được deadline.' }); }
}
module.exports = { moveExpired, readDeadlines, updateActive, saveSettings, restore };
