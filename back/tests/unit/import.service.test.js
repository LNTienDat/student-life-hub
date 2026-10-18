const ExcelJS = require('exceljs');
const { parseUpload, checkExisting, commitImport } = require('../../src/modules/imports/import.service');
const csv = (text, kind = 'subjects') => ({ kind, filename: 'test.csv', content: Buffer.from(text).toString('base64') });
const subjects = 'ten,tinChi,hocKy\n"Môn, có dấu",3,HK1';

test('CSV handles quoted names, BOM and semicolon files without changing text', async () => {
  const preview = await parseUpload(csv(subjects));
  expect(preview.rows[0].data).toEqual({ ten: 'Môn, có dấu', tinChi: 3, hocKy: 'HK1' });
  expect(preview.rows[0].errors).toEqual([]);
  expect((await parseUpload(csv('\uFEFFten;tinChi;hocKy\nToán;2;HK2'))).rows[0].data.ten).toBe('Toán');
});
test('invalid rows identify physical row numbers; duplicate file rows block commit', async () => {
  const preview = await parseUpload(csv('ten,tinChi,hocKy\nToán,2.5,\nToán,2.5,'));
  expect(preview.rows[0].line).toBe(2);
  expect(preview.rows[0].errors).toHaveLength(2);
  expect(preview.rows[1].errors).toContain('Trùng với một dòng khác trong tệp.');
});
test('invalid hours, weekday, extra columns and missing headers are rejected', async () => {
  const preview = await parseUpload(csv('tenMon,thu,gioBatDau,gioKetThuc,phongHoc,giangVien,hocKy\nToán,9,25:00,07:00,A,An,HK1,extra', 'timetable'));
  expect(preview.rows[0].errors).toHaveLength(3);
  await expect(parseUpload(csv('name,credits,term\nA,2,HK1'))).rejects.toThrow('Dùng các cột');
});
test('real XLSX reads Excel time fractions; formula cells cannot supply imported data', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');
  sheet.addRow(['tenMon','thu','gioBatDau','gioKetThuc','phongHoc','giangVien','hocKy']);
  sheet.addRow(['Toán',2,7/24,9/24,'A','An','HK1']);
  sheet.addRow([{ formula: '1+1', result: 2 },2,'07:00','09:00','','','HK1']);
  const preview = await parseUpload({ kind: 'timetable', filename: 'test.xlsx', content: Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64') });
  expect(preview.rows[0].data.gioBatDau).toBe('07:00');
  expect(preview.rows[0].errors).toEqual([]);
  expect(preview.rows[1].errors.join(' ')).toContain('không dùng công thức');
});
test('reject malformed workbook, unsupported file types and more than 500 rows', async () => {
  await expect(parseUpload({ kind: 'subjects', filename: 'bad.xlsx', content: Buffer.from('not a workbook').toString('base64') })).rejects.toThrow();
  await expect(parseUpload({ ...csv(subjects), filename: 'x.xls' })).rejects.toThrow('Chỉ nhận');
  await expect(parseUpload(csv('ten,tinChi,hocKy\n' + Array.from({ length: 501 }, (_, i) => `M${i},3,HK1`).join('\n')))).rejects.toThrow('1–500');
});
test('existing rows are checked within the signed-in user, normalized names are skipped', async () => {
  const findMany = jest.fn().mockResolvedValue([{ ten: 'môn, có dấu', hocKy: 'hk1' }]);
  const preview = await checkExisting({ monHoc: { findMany } }, 42, await parseUpload(csv(subjects)));
  expect(findMany).toHaveBeenCalledWith({ where: { idNguoiDung: 42 } });
  expect(preview.rows[0].skip).toBe(true);
});
test('commit is atomic, assigns ownership server-side, and repeat import skips saved rows', async () => {
  const saved = [];
  const tx = { monHoc: { findMany: jest.fn(async () => saved), createMany: jest.fn(async ({ data }) => saved.push(...data)) } };
  const prisma = { $transaction: jest.fn(async (operation) => operation(tx)) };
  const preview = await parseUpload(csv(subjects));
  expect(await commitImport(prisma, 42, preview)).toEqual({ count: 1, skipped: 0 });
  expect(saved[0].idNguoiDung).toBe(42);
  expect(await commitImport(prisma, 42, preview)).toEqual({ count: 0, skipped: 1 });
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  const invalid = await parseUpload(csv('ten,tinChi,hocKy\nA,3,HK1\nB,0,HK1'));
  await expect(commitImport(prisma, 42, invalid)).rejects.toThrow('Chưa lưu dòng nào');
  expect(tx.monHoc.createMany).toHaveBeenCalledTimes(1);
});
test('serialization conflicts are retried with a fresh duplicate check', async () => {
  const tx = { monHoc: { findMany: jest.fn(async () => []), createMany: jest.fn() } };
  const prisma = { $transaction: jest.fn().mockRejectedValueOnce({ code: 'P2034' }).mockImplementation(async (callback) => callback(tx)) };
  expect((await commitImport(prisma, 42, await parseUpload(csv(subjects)))).count).toBe(1);
  expect(prisma.$transaction).toHaveBeenCalledTimes(2);
});
