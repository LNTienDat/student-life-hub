
const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto');
const app=require('../../app'),prisma=require('../../src/prismaClient');
let a,b;const ids=[];const call=(u,m,p,body)=>{const r=request(app)[m]('/api/hoc-ky'+p).set('Authorization','Bearer '+u.token);return body?r.send(body):r;};
const subject=(u,hocKy)=>prisma.monHoc.create({data:{idNguoiDung:u.id,ten:'Môn thử',tinChi:3,hocKy,diems:{create:[{loaiDanhGia:'Cuối kỳ',diem:8,trongSo:100}]}}});
const lesson=(u,hocKy)=>prisma.thoiKhoaBieu.create({data:{idNguoiDung:u.id,hocKy,tenMon:'Lịch thử',thu:2,gioBatDau:'07:00',gioKetThuc:'09:00'}});
beforeAll(async()=>{const url=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Test DB required');const make=async()=>{const u=await prisma.nguoiDung.create({data:{ten:'Semester QA',email:randomUUID()+'@example.invalid',matKhau:'test-only',hocKyHienTai:'HK1'}});ids.push(u.id);return {...u,token:jwt.sign({id:u.id,matKhauDoiLuc:u.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await make();b=await make();});
afterAll(async()=>{await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('semester preview requires auth, a valid name and only exposes the current owner scope',async()=>{
 expect((await request(app).get('/api/hoc-ky/kiem-tra-xoa?ten=HK1')).status).toBe(401);
 for(const name of ['', 'x'.repeat(101)])expect((await call(a,'get','/kiem-tra-xoa?ten='+encodeURIComponent(name))).status).toBe(400);
 await subject(b,'ONLY-B');expect((await call(a,'get','/kiem-tra-xoa?ten=ONLY-B')).status).toBe(404);
});
test('semester delete requires a reviewed snapshot and matching typed name, including for empty current semesters',async()=>{
 const preview=(await call(a,'get','/kiem-tra-xoa?ten=hk1')).body;expect(preview).toMatchObject({ten:'HK1',soMon:0,soDiem:0,soBuoi:0,dangHoc:true});
 expect((await call(a,'delete','/',{ten:'HK1',snapshot:preview.snapshot,xacNhan:'HK2'})).status).toBe(400);
 expect((await call(a,'delete','/',{ten:'HK1',snapshot:'0'.repeat(64),xacNhan:'HK1'})).status).toBe(409);
 expect((await prisma.nguoiDung.findUnique({where:{id:a.id}})).hocKyHienTai).toBe('HK1');
});
test('stale preview after a new grade cannot delete until the scope is reviewed again',async()=>{
 const s=await subject(a,'HK-STALE'),preview=(await call(a,'get','/kiem-tra-xoa?ten=HK-STALE')).body;
 await prisma.diem.create({data:{idMonHoc:s.id,loaiDanhGia:'Thử',diem:5,trongSo:0}});
 expect((await call(a,'delete','/',{ten:'HK-STALE',snapshot:preview.snapshot,xacNhan:'HK-STALE'})).status).toBe(409);
 expect(await prisma.monHoc.findUnique({where:{id:s.id}})).not.toBeNull();expect(await prisma.diem.count({where:{idMonHoc:s.id}})).toBe(2);
 const fresh=(await call(a,'get','/kiem-tra-xoa?ten=HK-STALE')).body;expect(fresh.soDiem).toBe(2);
 expect((await call(a,'delete','/',{ten:'HK-STALE',snapshot:fresh.snapshot,xacNhan:'HK-STALE'})).status).toBe(200);
});
test('delete unifies legacy semester spelling, removes only its subjects/grades/schedule/exceptions and preserves deadlines, finances, shared classes and other owners',async()=>{
 const owned=await subject(a,' hk1 '),keep=await subject(a,'HK2'),other=await subject(b,'HK1');
 const cls=await lesson(a,'HK1'),shared=await lesson(a,''),otherCls=await lesson(b,'HK1');
 await prisma.dieuChinhLich.create({data:{idNguoiDung:a.id,idBuoiHoc:cls.id,ngayGoc:'2026-10-26',loai:'nghi'}});
 const deadline=await prisma.deadline.create({data:{idNguoiDung:a.id,idMonHoc:owned.id,tieuDe:'Giữ việc',hanChot:new Date()}});
 const money=await prisma.giaoDich.create({data:{idNguoiDung:a.id,loai:'thu',danhMuc:'khac',soTien:100000}});
 const preview=(await call(a,'get','/kiem-tra-xoa?ten=hk1')).body;expect(preview).toMatchObject({soMon:1,soDiem:1,soBuoi:1,soDieuChinh:1,soDeadlineGiuLai:1});
 const response=await call(a,'delete','/',{ten:'HK1',snapshot:preview.snapshot,xacNhan:'hk1'});expect(response.status).toBe(200);expect(response.body.hocKyHienTai).toBe('');
 expect(await prisma.monHoc.findUnique({where:{id:owned.id}})).toBeNull();expect(await prisma.diem.count({where:{idMonHoc:owned.id}})).toBe(0);
 expect(await prisma.thoiKhoaBieu.findUnique({where:{id:cls.id}})).toBeNull();expect(await prisma.dieuChinhLich.count({where:{idBuoiHoc:cls.id}})).toBe(0);
 expect((await prisma.deadline.findUnique({where:{id:deadline.id}})).idMonHoc).toBeNull();expect((await prisma.giaoDich.findUnique({where:{id:money.id}})).soTien).toBe(100000);
 for(const id of [keep.id,other.id])expect(await prisma.monHoc.findUnique({where:{id}})).not.toBeNull();
 for(const id of [shared.id,otherCls.id])expect(await prisma.thoiKhoaBieu.findUnique({where:{id}})).not.toBeNull();
 expect((await prisma.nguoiDung.findUnique({where:{id:b.id}})).hocKyHienTai).toBe('HK1');
 expect((await call(a,'delete','/',{ten:'HK1',snapshot:preview.snapshot,xacNhan:'HK1'})).status).toBe(404);
});
test('a profile-only empty semester can be removed without deleting any academic or financial data',async()=>{
 await prisma.nguoiDung.update({where:{id:a.id},data:{hocKyHienTai:'EMPTY'}});
 const [subjects,money]=await Promise.all([prisma.monHoc.count({where:{idNguoiDung:a.id}}),prisma.giaoDich.count({where:{idNguoiDung:a.id}})]);
 const preview=(await call(a,'get','/kiem-tra-xoa?ten=EMPTY')).body;expect(preview.soMon).toBe(0);
 expect((await call(a,'delete','/',{ten:'EMPTY',snapshot:preview.snapshot,xacNhan:'EMPTY'})).status).toBe(200);
 expect(await prisma.monHoc.count({where:{idNguoiDung:a.id}})).toBe(subjects);expect(await prisma.giaoDich.count({where:{idNguoiDung:a.id}})).toBe(money);
});
