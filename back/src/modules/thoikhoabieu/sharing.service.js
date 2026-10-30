const crypto = require('crypto');
const { normalizeSemester, filterSemester } = require('../../utils/semester.util');
const { serializable, httpError } = require('../../utils/transaction.util');

async function sharingStatus(client, userId) {
  const [user, rows] = await Promise.all([
    client.nguoiDung.findUnique({ where: { id: userId }, select: { hocKyHienTai: true, shareToken: true, shareEnabled: true, shareHocKy: true } }),
    client.thoiKhoaBieu.findMany({ where: { idNguoiDung: userId }, select: { hocKy: true } }),
  ]);
  if (!user) throw httpError(404, 'Không tìm thấy tài khoản.');
  const hocKys = [...new Set([user.hocKyHienTai, ...rows.map(row => row.hocKy)].map(normalizeSemester).filter(Boolean))].sort((a, b) => b.localeCompare(a, 'vi', { numeric: true }));
  const current = normalizeSemester(user.hocKyHienTai);
  const shareEnabled = user.shareEnabled && user.shareHocKy != null;
  return {
    shareToken: shareEnabled ? user.shareToken : null, shareEnabled,
    hocKyChiaSe: user.shareHocKy == null ? null : normalizeSemester(user.shareHocKy),
    hocKyDeXuat: current || (hocKys.length === 1 ? hocKys[0] : hocKys.length ? null : ''),
    hocKys, canTaoLaiLienKet: user.shareEnabled && user.shareHocKy == null,
  };
}
async function enableSharing(prisma, userId, input) {
  if (input !== undefined && (typeof input !== 'string' || input.length > 100 || (input !== '' && !input.trim()))) throw httpError(400, 'Học kỳ chia sẻ không hợp lệ.');
  return serializable(prisma, async tx => {
    const status = await sharingStatus(tx, userId);
    const scope = input === undefined ? status.hocKyDeXuat : normalizeSemester(input);
    if (scope === null || scope.length > 100) throw httpError(400, 'Chọn học kỳ trước khi bật chia sẻ.');
    if (scope && !status.hocKys.includes(scope)) throw httpError(400, 'Học kỳ này không có trong lịch hoặc học kỳ đang học của bạn.');
    const token = status.shareEnabled && status.hocKyChiaSe === scope ? status.shareToken : crypto.randomUUID();
    await tx.nguoiDung.update({ where: { id: userId }, data: { shareToken: token, shareEnabled: true, shareHocKy: scope } });
    return { shareToken: token, shareEnabled: true, hocKyChiaSe: scope };
  });
}
function filterSharedScope(rows, scope) {
  return scope ? filterSemester(rows, scope, true) : rows.filter(row => !normalizeSemester(row.hocKy)).map(row => ({ ...row, hocKy: '' }));
}
module.exports = { sharingStatus, enableSharing, filterSharedScope };
