const prisma = require('../../src/prismaClient');
const { parseUpload, commitImport, checkExisting } = require('../../src/modules/imports/import.service');

test('database stores checklist and semesters; repeated imports skip duplicates with user isolation', async () => {
  const rollback = new Error('ROLLBACK_TEST_DATA');
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.nguoiDung.create({ data: { email: `workflow-${Date.now()}@example.invalid`, matKhau: 'test-placeholder', ten: 'Workflow test' } });
      const checklist = [{ id: 'step1', title: 'Tìm tài liệu', done: true }];
      const task = await tx.deadline.create({ data: { idNguoiDung: user.id, tieuDe: 'Test task', hanChot: new Date(), checklist } });
      expect((await tx.deadline.findUnique({ where: { id: task.id } })).checklist).toEqual(checklist);
      const preview = await parseUpload({ kind: 'subjects', filename: 'test.csv', content: Buffer.from('ten,tinChi,hocKy\nDatabase,3,HK1').toString('base64') });
      const bridge = { $transaction: (callback) => callback(tx) };
      expect(await commitImport(bridge, user.id, preview)).toEqual({ count: 1, skipped: 0 });
      expect(await commitImport(bridge, user.id, preview)).toEqual({ count: 0, skipped: 1 });
      expect((await checkExisting(tx, -1, preview)).rows[0].skip).toBe(false);
      await tx.thoiKhoaBieu.create({ data: { idNguoiDung: user.id, tenMon: 'Database', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00', hocKy: 'HK1' } });
      expect(await tx.thoiKhoaBieu.count({ where: { idNguoiDung: user.id, hocKy: 'HK2' } })).toBe(0);
      expect(await tx.thoiKhoaBieu.count({ where: { idNguoiDung: user.id, hocKy: 'HK1' } })).toBe(1);
      throw rollback;
    }, { isolationLevel: 'Serializable', timeout: 15000 });
  } catch (error) { if (error !== rollback) throw error; }
}, 20000);

afterAll(async () => { await prisma.$disconnect(); });
