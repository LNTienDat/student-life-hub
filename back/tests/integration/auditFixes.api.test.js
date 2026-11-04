const request = require('supertest'), jwt = require('jsonwebtoken'), { randomUUID } = require('crypto');
const app = require('../../app'), prisma = require('../../src/prismaClient');
const { layDuLieuSinhVien } = require('../../src/modules/chatbot/chatbot.service');
let a,b; const ids=[];
const call=(u,m,p,body)=>{const r=request(app)[m]('/api'+p);if(u)r.set('Authorization','Bearer '+u.token);return body===undefined?r:r.send(body);};
const makeClass=(u,tenMon,hocKy,thu=2,gioBatDau='07:00',gioKetThuc='09:00')=>prisma.thoiKhoaBieu.create({data:{idNguoiDung:u.id,tenMon,hocKy,thu,gioBatDau,gioKetThuc}});
beforeAll(async()=>{
 const url=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Test DB required');
 const create=async()=>{const u=await prisma.nguoiDung.create({data:{ten:'Audit fixes',email:randomUUID()+'@example.invalid',matKhau:'test-only',hocKyHienTai:'HK2'}});ids.push(u.id);return {...u,token:jwt.sign({id:u.id,matKhauDoiLuc:u.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await create();b=await create();
});
beforeEach(async()=>{await prisma.thoiKhoaBieu.deleteMany({where:{idNguoiDung:{in:ids}}});await prisma.nguoiDung.updateMany({where:{id:{in:ids}},data:{hocKyHienTai:'HK2',shareEnabled:false,shareToken:null,shareHocKy:null}});});
afterAll(async()=>{await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('chat schedule uses current semester, shared classes and actual cancellations/moves across Sunday/Monday',async()=>{
 const now=new Date('2026-11-01T10:00:00Z'); // Sunday 17:00 VN; tomorrow belongs to another week
 const gone=await makeClass(a,'Cancelled','HK2',8),moved=await makeClass(a,'Moved in','HK2',2,'10:00','11:00');
 await makeClass(a,'Old semester','HK1',8);await makeClass(a,'Shared','',8,'12:00','13:00');await makeClass(b,'Other account','HK2',8);
 await prisma.dieuChinhLich.createMany({data:[
  {idNguoiDung:a.id,idBuoiHoc:gone.id,ngayGoc:'2026-11-01',loai:'nghi'},
  {idNguoiDung:a.id,idBuoiHoc:moved.id,ngayGoc:'2026-10-26',loai:'doi',ngayMoi:'2026-11-02',gioBatDau:'14:00',gioKetThuc:'15:00',phongHoc:'B202'},
 ]});
 const data=await layDuLieuSinhVien(a.id,['lichHoc'],now);
 expect(data.lichHoc.hocKy).toBe('HK2');expect(data.lichHoc.homNay.map(c=>c.mon)).toEqual(['Shared']);
 expect(data.lichHoc.ngayMai).toEqual(expect.arrayContaining([expect.objectContaining({mon:'Moved in',batDau:'10:00'}),expect.objectContaining({mon:'Moved in',batDau:'14:00',phong:'B202'})]));
 expect(JSON.stringify(data)).not.toMatch(/Old semester|Other account/);
 expect(data.lichHoc.lich.filter(c=>c.ngay==='2026-11-01').map(c=>c.mon)).not.toContain('Cancelled');
 // The cancellation applies to one occurrence, not the other weeks now in AI context.
 expect(data.lichHoc.lich).toEqual(expect.arrayContaining([expect.objectContaining({ngay:'2026-11-08',mon:'Cancelled'})]));
});
test('chat with no current semester explains all-semester fallback and respects rescheduled time',async()=>{
 await prisma.nguoiDung.update({where:{id:a.id},data:{hocKyHienTai:''}});
 const row=await makeClass(a,'Shifted','HK1',2);
 await prisma.dieuChinhLich.create({data:{idNguoiDung:a.id,idBuoiHoc:row.id,ngayGoc:'2026-11-02',loai:'doi',ngayMoi:'2026-11-02',gioBatDau:'14:00',gioKetThuc:'15:00'}});
 const data=await layDuLieuSinhVien(a.id,['lichHoc'],new Date('2026-11-02T00:00:00Z'));
 expect(data.lichHoc.hocKy).toBe('');expect(data.lichHoc.homNay).toEqual([expect.objectContaining({batDau:'14:00',ketThuc:'15:00'})]);
});
test('public sharing defaults to current semester, blocks query overrides, stays fixed after profile changes',async()=>{
 await makeClass(a,'Old','HK1');await makeClass(a,'Current',' hk2 ');await makeClass(a,'Common','',3);await makeClass(b,'Secret','HK2');
 const enabled=await call(a,'post','/thoi-khoa-bieu/share/bat',{});expect(enabled.status).toBe(200);expect(enabled.body.hocKyChiaSe).toBe('HK2');
 await prisma.nguoiDung.update({where:{id:a.id},data:{hocKyHienTai:'HK1'}});
 const publicView=await call(null,'get','/thoi-khoa-bieu/share/public/'+enabled.body.shareToken+'?hocKy=HK1&tuNgay=2026-10-26');
 expect(publicView.body.hocKyChiaSe).toBe('HK2');expect(publicView.body.thoiKhoaBieu.map(c=>c.tenMon).sort()).toEqual(['Common','Current']);
 const same=await call(a,'post','/thoi-khoa-bieu/share/bat',{hocKy:'HK2'});expect(same.body.shareToken).toBe(enabled.body.shareToken);
 const changed=await call(a,'post','/thoi-khoa-bieu/share/bat',{hocKy:'hk1'});expect(changed.body.shareToken).not.toBe(enabled.body.shareToken);
 expect((await call(null,'get','/thoi-khoa-bieu/share/public/'+enabled.body.shareToken)).status).toBe(404);
 expect((await call(null,'get','/thoi-khoa-bieu/share/public/'+changed.body.shareToken)).body.thoiKhoaBieu.map(c=>c.tenMon).sort()).toEqual(['Common','Old']);
 await call(a,'post','/thoi-khoa-bieu/share/tat',{});expect((await call(null,'get','/thoi-khoa-bieu/share/public/'+changed.body.shareToken)).status).toBe(404);
});
test('sharing only unassigned classes never widens scope and applies day adjustments',async()=>{
 await makeClass(a,'Private semester','HK2');const row=await makeClass(a,'Common','');
 await prisma.dieuChinhLich.create({data:{idNguoiDung:a.id,idBuoiHoc:row.id,ngayGoc:'2026-10-26',loai:'nghi'}});
 const enabled=await call(a,'post','/thoi-khoa-bieu/share/bat',{hocKy:''});expect(enabled.status).toBe(200);
 const base=await call(null,'get','/thoi-khoa-bieu/share/public/'+enabled.body.shareToken);expect(base.body.thoiKhoaBieu.map(c=>c.tenMon)).toEqual(['Common']);
 const week=await call(null,'get','/thoi-khoa-bieu/share/public/'+enabled.body.shareToken+'?tuNgay=2026-10-26');expect(week.body.thoiKhoaBieu).toEqual([]);
 expect((await call(null,'get','/thoi-khoa-bieu/share/public/'+enabled.body.shareToken+'?tuNgay=2026-02-30')).status).toBe(400);
});
test('unscoped legacy links fail closed and require reissue; ambiguous/unknown/invalid semesters rejected',async()=>{
 await makeClass(a,'First','HK1');await makeClass(a,'Second','HK2');
 await prisma.nguoiDung.update({where:{id:a.id},data:{hocKyHienTai:'',shareEnabled:true,shareToken:'legacy-'+randomUUID(),shareHocKy:null}});
 const status=await call(a,'get','/thoi-khoa-bieu/share/trang-thai');expect(status.body).toMatchObject({shareEnabled:false,shareToken:null,canTaoLaiLienKet:true,hocKyDeXuat:null});
 const legacy=await prisma.nguoiDung.findUnique({where:{id:a.id}});expect((await call(null,'get','/thoi-khoa-bieu/share/public/'+legacy.shareToken)).status).toBe(404);
 for(const body of [{},{hocKy:'UNKNOWN'},{hocKy:12},{hocKy:' '},{hocKy:'x'.repeat(101)}])expect((await call(a,'post','/thoi-khoa-bieu/share/bat',body)).status).toBe(400);
 const valid=await call(a,'post','/thoi-khoa-bieu/share/bat',{hocKy:'HK1'});expect(valid.status).toBe(200);expect(valid.body.shareToken).not.toBe(legacy.shareToken);
});
test('built-in retrieval guide describes current dated schedules and sharing scope',async()=>{
 const r=await call(a,'post','/chatbot/hoi-dap',{cheDo:'tai_lieu',tinNhan:'Nhập thời khóa biểu từ ảnh lịch lặp theo tuần trong học kỳ',dungAI:false});
 expect(r.status).toBe(200);const source=r.body.thamKhao.find(s=>s.trang===3);expect(source).toBeDefined();expect(source.noiDung).toContain('báo nghỉ hoặc đổi riêng một ngày');expect(source.noiDung).not.toContain('chưa có ngoại lệ');
 const guide=require('../../src/modules/rag/lifehub-guide');expect(guide.tenTep).toContain('28/10/2026');expect(guide.cacDoan.some(c=>c.noiDung.includes('Link giữ nguyên phạm vi'))).toBe(true);
});
