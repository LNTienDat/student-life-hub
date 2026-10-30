
const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto');
const app=require('../../app'),prisma=require('../../src/prismaClient');
const {parseUpload,commitImport}=require('../../src/modules/imports/import.service');
let a,b;const ids=[];
const call=(user,method,url,body)=>{const r=request(app)[method]('/api'+url).set('Authorization','Bearer '+user.token);return body?r.send(body):r;};
const makeClass=(u,title,day,start,end,semester='HK1')=>call(u,'post','/thoi-khoa-bieu',{tenMon:title,thu:day,gioBatDau:start,gioKetThuc:end,hocKy:semester});
beforeAll(async()=>{
const db=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(db.hostname)||!db.pathname.endsWith('_test'))throw Error('Isolated test DB required');
const make=async()=>{const user=await prisma.nguoiDung.create({data:{ten:'Completion test',email:randomUUID()+'@example.invalid',matKhau:'test-only'}});ids.push(user.id);return {...user,token:jwt.sign({id:user.id,matKhauDoiLuc:user.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await make();b=await make();
});
afterAll(async()=>{if(ids.length)await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test.each([0.5,1000000000001,9007199254740992,'Infinity','20abc',true,[20000],0,-1])('money limits apply to transaction create/edit and budget %p',async value=>{
expect((await call(a,'post','/finance/giao-dich',{loai:'chi',danhMuc:'khac',soTien:value})).status).toBe(400);
expect((await call(a,'put','/finance/giao-dich/1',{soTien:value})).status).toBe(400);
expect((await call(a,'post','/finance/ngan-sach',{danhMuc:'khac',soTienToiDa:value,thang:10,nam:2026})).status).toBe(400);
});
test('category management renames without changing codes/history and search finds owner labels without accents',async()=>{
const made=(await call(a,'post','/finance/danh-muc',{loai:'chi',ten:'Mua sách'})).body.danhMuc;
const gd=await call(a,'post','/finance/giao-dich',{loai:'chi',danhMuc:made.ma,soTien:20000,moTa:'ABC'});
expect(gd.status).toBe(201);
expect((await call(a,'get','/finance/giao-dich?q=mua%20sach')).body.tongSo).toBe(1);
expect((await call(b,'get','/finance/giao-dich?q=mua%20sach')).body.tongSo).toBe(0);
expect((await call(b,'put','/finance/danh-muc/'+made.ma,{ten:'Khác tên'})).status).toBe(404);
expect((await call(a,'put','/finance/danh-muc/'+made.ma,{ten:'Giáo trình'})).body.danhMuc.ten).toBe('Giáo trình');
expect((await call(a,'get','/finance/giao-dich?q=giao%20trinh')).body.tongSo).toBe(1);
expect((await prisma.giaoDich.findUnique({where:{id:gd.body.giaoDich.id}})).danhMuc).toBe(made.ma);
expect((await call(a,'put','/finance/danh-muc/'+made.ma,{ten:'Ăn uống'})).status).toBe(409);
expect((await call(a,'put','/finance/danh-muc/an_uong',{ten:'ABC'})).status).toBe(200);
});
test('remove budget only for owner and selected month; transactions remain',async()=>{
const one=(await call(a,'post','/finance/ngan-sach',{danhMuc:'an_uong',soTienToiDa:10000,thang:10,nam:2026})).body.nganSach;
const two=(await call(a,'post','/finance/ngan-sach',{danhMuc:'an_uong',soTienToiDa:30000,thang:11,nam:2026})).body.nganSach;
const count=await prisma.giaoDich.count({where:{idNguoiDung:a.id}});
expect((await call(b,'delete','/finance/ngan-sach/'+one.id)).status).toBe(404);
expect((await call(a,'delete','/finance/ngan-sach/'+one.id)).status).toBe(200);
expect(await prisma.nganSach.findUnique({where:{id:two.id}})).not.toBeNull();
expect(await prisma.giaoDich.count({where:{idNguoiDung:a.id}})).toBe(count);
});
test('receipt duplicate requires explicit confirmation, stays owner scoped and concurrent first saves do not duplicate',async()=>{
const body={loai:'chi',danhMuc:'an_uong',soTien:20000,anhHoaDonHash:'a'.repeat(64)};
expect((await call(a,'post','/finance/giao-dich',body)).status).toBe(201);
const duplicate=await call(a,'post','/finance/giao-dich',body);expect(duplicate.status).toBe(409);expect(duplicate.body.code).toBe('RECEIPT_DUPLICATE');
expect((await call(b,'post','/finance/giao-dich',body)).status).toBe(201);
expect((await call(a,'post','/finance/giao-dich',{...body,choPhepTrungHoaDon:true})).status).toBe(201);
expect((await call(a,'post','/finance/giao-dich',{...body,choPhepTrungHoaDon:'true'})).status).toBe(400);
const replies=await Promise.all([call(a,'post','/finance/giao-dich',{...body,anhHoaDonHash:'b'.repeat(64)}),call(a,'post','/finance/giao-dich',{...body,anhHoaDonHash:'b'.repeat(64)})]);expect(replies.map(r=>r.status).sort()).toEqual([201,409]);
});
test('semester aliases share subject/GPA/view scope, and overlap detection covers old lowercase labels',async()=>{
await prisma.thoiKhoaBieu.deleteMany({where:{idNguoiDung:a.id}});
const old=await prisma.thoiKhoaBieu.create({data:{idNguoiDung:a.id,tenMon:'Old',hocKy:'hk1',thu:2,gioBatDau:'07:00',gioKetThuc:'09:00'}});
expect((await makeClass(a,'Conflicting',2,'08:00','10:00',' Hk1 ')).status).toBe(409);
const view=await call(a,'get','/thoi-khoa-bieu?hocKy=HK1');expect(view.body.thoiKhoaBieu.map(r=>r.id)).toContain(old.id);expect(view.body.thoiKhoaBieu[0].hocKy).toBe('HK1');
const subject=await call(a,'post','/academic/mon-hoc',{ten:'Test',tinChi:3,hocKy:' hk1 '});
expect(subject.status).toBe(201);expect((await call(a,'get','/academic/mon-hoc?hocKy=hk1')).body.monHocs).toHaveLength(1);
const profile=await call(a,'put','/auth/ho-so',{hocKyHienTai:' hk1  2026 – 2027 '});expect(profile.body.user.hocKyHienTai).toBe('HK1 2026-2027');
});
test('bell includes overdue and all of third Vietnam day, excluding completed/far future',async()=>{
const past=await prisma.deadline.create({data:{idNguoiDung:a.id,tieuDe:'Past',hanChot:new Date(Date.now()-3600000)}});
const near=await prisma.deadline.create({data:{idNguoiDung:a.id,tieuDe:'Near',hanChot:new Date(Date.now()+48*3600000)}});
const far=await prisma.deadline.create({data:{idNguoiDung:a.id,tieuDe:'Far',hanChot:new Date(Date.now()+5*86400000)}});
const notes=(await call(a,'get','/thong-bao')).body.thongBaos;
expect(notes.some(n=>n.id.startsWith('deadline-'+past.id+'-'))).toBe(true);expect(notes.some(n=>n.id.startsWith('deadline-'+near.id+'-'))).toBe(true);expect(notes.some(n=>n.id.startsWith('deadline-'+far.id+'-'))).toBe(false);
});
test('cancel and reschedule only one date, check actual dated overlaps, undo and scope public/other users',async()=>{
await prisma.thoiKhoaBieu.deleteMany({where:{idNguoiDung:a.id}});
const mon=(await makeClass(a,'Toán',2,'07:00','09:00')).body.buoiHoc;
const tue=(await makeClass(a,'Lý',3,'09:00','10:00')).body.buoiHoc;
expect(mon).toBeDefined();expect(tue).toBeDefined();
const edit=url=>'/thoi-khoa-bieu/'+mon.id+'/dieu-chinh'+(url||'');
expect((await call(b,'put',edit(),{ngayGoc:'2026-10-26',loai:'nghi'})).status).toBe(404);
expect((await call(a,'put',edit(),{ngayGoc:'2026-10-27',loai:'nghi'})).status).toBe(400);
let change=await call(a,'put',edit(),{ngayGoc:'2026-10-26',loai:'nghi'});expect(change.status).toBe(200);
expect((await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-10-26')).body.thoiKhoaBieu.map(x=>x.tenMon)).toEqual(['Lý']);
expect((await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-11-02')).body.thoiKhoaBieu).toHaveLength(2);
expect((await call(a,'put',edit(),{ngayGoc:'2026-10-26',loai:'doi',ngayMoi:'2026-10-27',gioBatDau:'09:30',gioKetThuc:'10:30'})).status).toBe(409);
change=await call(a,'put',edit(),{ngayGoc:'2026-10-26',loai:'doi',ngayMoi:'2026-10-27',gioBatDau:'10:00',gioKetThuc:'11:00',phongHoc:'B202'});expect(change.status).toBe(200);
const projected=(await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-10-26')).body.thoiKhoaBieu.find(x=>x.id===mon.id);expect(projected).toMatchObject({thu:3,ngayHoc:'2026-10-27',phongHoc:'B202',gioBatDau:'10:00'});
expect((await prisma.thoiKhoaBieu.findUnique({where:{id:mon.id}})).gioBatDau).toBe('07:00');
expect((await call(a,'put','/thoi-khoa-bieu/'+mon.id,{thu:4})).status).toBe(409);
const share=(await call(a,'post','/thoi-khoa-bieu/share/bat',{hocKy:'HK1'})).body.shareToken;
expect((await request(app).get('/api/thoi-khoa-bieu/share/public/'+share+'?tuNgay=2026-10-26')).body.thoiKhoaBieu.find(x=>x.id===mon.id).phongHoc).toBe('B202');
expect((await call(b,'delete','/thoi-khoa-bieu/dieu-chinh/'+change.body.dieuChinh.id)).status).toBe(404);
expect((await call(a,'delete','/thoi-khoa-bieu/dieu-chinh/'+change.body.dieuChinh.id)).status).toBe(200);
expect((await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-10-26')).body.thoiKhoaBieu.find(x=>x.id===mon.id).thu).toBe(2);
expect((await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-02-30')).status).toBe(400);
});
test('moving across weeks preserves the next regular occurrence and rollback on undo conflict',async()=>{
await prisma.thoiKhoaBieu.deleteMany({where:{idNguoiDung:a.id}});
const one=(await makeClass(a,'One',2,'07:00','09:00')).body.buoiHoc;
const two=(await makeClass(a,'Two',2,'11:00','12:00')).body.buoiHoc;
let change=(await call(a,'put','/thoi-khoa-bieu/'+one.id+'/dieu-chinh',{ngayGoc:'2026-10-26',loai:'doi',ngayMoi:'2026-11-03',gioBatDau:'10:00',gioKetThuc:'11:00'})).body.dieuChinh;
const next=(await call(a,'get','/thoi-khoa-bieu?tuNgay=2026-11-02')).body.thoiKhoaBieu.filter(x=>x.id===one.id);expect(next).toHaveLength(2);expect(new Set(next.map(x=>x.occurrenceId)).size).toBe(2);
const second=await call(a,'put','/thoi-khoa-bieu/'+two.id+'/dieu-chinh',{ngayGoc:'2026-10-26',loai:'doi',ngayMoi:'2026-10-26',gioBatDau:'07:00',gioKetThuc:'09:00'});expect(second.status).toBe(200);
expect((await call(a,'delete','/thoi-khoa-bieu/dieu-chinh/'+change.id)).status).toBe(409);
expect(await prisma.dieuChinhLich.findUnique({where:{id:change.id}})).not.toBeNull();
const csv='tenMon,thu,gioBatDau,gioKetThuc,phongHoc,giangVien,hocKy\nImported,3,10:00,11:00,,,HK1';
const preview=await parseUpload({kind:'timetable',filename:'a.csv',content:Buffer.from(csv).toString('base64')});
await expect(commitImport(prisma,a.id,preview)).rejects.toThrow(/trùng giờ/);
expect(await prisma.thoiKhoaBieu.count({where:{idNguoiDung:a.id,tenMon:'Imported'}})).toBe(0);
});

test('different receipt photos with matching description, date and amount warn without blocking explicitly confirmed separate purchases',async()=>{
const body={loai:'chi',danhMuc:'an_uong',soTien:21000,moTa:'Quán cơm sinh viên',ngayGiaoDich:'2026-10-26'};
expect((await call(a,'post','/finance/giao-dich',{...body,anhHoaDonHash:'c'.repeat(64)})).status).toBe(201);
expect((await call(a,'post','/finance/giao-dich',{...body,anhHoaDonHash:'d'.repeat(64)})).status).toBe(409);
expect((await call(a,'post','/finance/giao-dich',{...body,anhHoaDonHash:'d'.repeat(64),choPhepTrungHoaDon:true})).status).toBe(201);
});
