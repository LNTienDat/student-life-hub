jest.mock('../../src/prismaClient', () => ({
  $transaction: jest.fn(async fn => fn(require('../../src/prismaClient'))),
  $queryRaw: jest.fn(),
  nguoiDung: { findUnique: jest.fn(), update: jest.fn() },
}));
const { validAvatar } = require('../../src/utils/avatar.util');
const prisma = require('../../src/prismaClient');
const { suaHoSo } = require('../../src/modules/auth/auth.controller');
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
test.each(['', 'preset:cat', 'preset:bird', 'preset:rabbit', 'preset:dog', 'preset:sprout', 'preset:rocket'])('accepts default and supported preset %s', value => expect(validAvatar(value)).toBe(true));
test.each([null, {}, 'https://example.com/photo.jpg', 'javascript:alert(1)', 'preset:unknown', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,aGVsbG8=', 'data:image/png;base64,' + 'A'.repeat(120000)])('rejects unsupported or forged image %p', value => expect(validAvatar(value)).toBe(false));
test('accepts a bounded PNG and rejects a forged large image dimension', () => {
  const png = Buffer.alloc(32); Buffer.from([137,80,78,71,13,10,26,10]).copy(png); png.write('IHDR',12); png.writeUInt32BE(256,16); png.writeUInt32BE(256,20);
  expect(validAvatar('data:image/png;base64,' + png.toString('base64'))).toBe(true);
  png.writeUInt32BE(99999,16); expect(validAvatar('data:image/png;base64,' + png.toString('base64'))).toBe(false);
});
test('avatar update uses authenticated account, preserves semester history and excludes secrets', async () => {
  prisma.nguoiDung.findUnique.mockResolvedValue({ id:42, hocKyHienTai:'HK1', hocKyDaLuu:['HK1'] });
  prisma.nguoiDung.update.mockResolvedValue({id:42, avatar:'preset:cat', matKhau:'secret', resetPasswordToken:'private',resetPasswordExpiry:new Date()});
  const res = response(); await suaHoSo({user:{id:42},body:{id:99,avatar:'preset:cat'}},res);
  expect(prisma.nguoiDung.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:42},data:expect.objectContaining({avatar:'preset:cat',hocKyDaLuu:['HK1']})}));
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({user:{id:42,avatar:'preset:cat'}}));
});
test('invalid avatar never writes the database', async () => {
  jest.clearAllMocks(); const res=response(); await suaHoSo({user:{id:42},body:{avatar:'data:image/svg+xml;base64,PHN2Zz4='}},res);
  expect(res.status).toHaveBeenCalledWith(400); expect(prisma.nguoiDung.update).not.toHaveBeenCalled();
});
