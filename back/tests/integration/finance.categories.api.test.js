const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto'),ExcelJS=require('exceljs');
const app=require('../../app'),prisma=require('../../src/prismaClient');
let a,b,custom;const ids=[];
const call=(user,method,path,body)=>{const req=request(app)[method]('/api/finance'+path).set('Authorization','Bearer '+user.token);return body?req.send(body):req;};
beforeAll(async()=>{const db=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(db.hostname)||!db.pathname.endsWith('_test'))throw Error('Isolated test database required');
const make=async()=>{const u=await prisma.nguoiDung.create({data:{ten:'Category test',email:randomUUID()+'@example.invalid',matKhau:'test-only'}});ids.push(u.id);return {...u,token:jwt.sign({id:u.id,matKhauDoiLuc:u.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await make();b=await make();});
afterAll(async()=>{if(ids.length)await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('new account has only three starter expense categories plus Other income',async()=>{const response=await call(a,'get','/danh-muc');expect(response.status).toBe(200);expect(response.body.danhMucs.filter(c=>c.loai==='chi').map(c=>c.ma)).toEqual(['an_uong','di_lai','khac']);expect(response.body.danhMucs.filter(c=>c.loai==='thu').map(c=>c.ma)).toEqual(['khac']);});
test('custom category persists to owner, ignores supplied user id, and normalized duplicate requests are idempotent',async()=>{
const made=await call(a,'post','/danh-muc',{loai:'chi',ten:' Mua sách ',idNguoiDung:b.id});expect(made.status).toBe(201);custom=made.body.danhMuc;
const duplicate=await call(a,'post','/danh-muc',{loai:'chi',ten:'mua sach'});expect(duplicate.body.danhMuc.ma).toBe(custom.ma);
expect((await call(a,'get','/danh-muc')).body.danhMucs).toEqual(expect.arrayContaining([expect.objectContaining({ma:custom.ma,ten:'Mua sách'})]));
expect((await call(b,'get','/danh-muc')).body.danhMucs.some(c=>c.ma===custom.ma)).toBe(false);
});
test.each([{loai:'bad',ten:'ABC'},{loai:'chi',ten:''},{loai:'chi',ten:' '},{loai:'chi',ten:{}},{loai:'chi',ten:'x'.repeat(51)}])('reject malformed custom category: %p',async body=>{expect((await call(a,'post','/danh-muc',body)).status).toBe(400);});
test('duplicate creates in parallel do not create duplicate names',async()=>{const replies=await Promise.all([call(a,'post','/danh-muc',{loai:'chi',ten:'Dụng cụ'}),call(a,'post','/danh-muc',{loai:'chi',ten:'dung cu'})]);expect(replies.every(r=>r.status===201)).toBe(true);expect(replies[0].body.danhMuc.ma).toBe(replies[1].body.danhMuc.ma);});
test('legacy categories used in old transactions remain visible without seeding every preset',async()=>{await prisma.giaoDich.create({data:{idNguoiDung:b.id,loai:'thu',danhMuc:'luong',soTien:100000}});const list=(await call(b,'get','/danh-muc')).body.danhMucs;expect(list.some(c=>c.ma==='luong')).toBe(true);expect(list.some(c=>c.ma==='hoc_bong')).toBe(false);});
test('custom categories work for create/edit/filter and cannot be used by another account',async()=>{
expect((await call(b,'post','/giao-dich',{loai:'chi',danhMuc:custom.ma,soTien:20000})).status).toBe(400);
expect((await call(b,'get','/giao-dich?danhMuc='+custom.ma)).status).toBe(400);
const created=await call(a,'post','/giao-dich',{loai:'chi',danhMuc:custom.ma,soTien:20000,moTa:'Receipt reviewed'});expect(created.status).toBe(201);
expect((await call(a,'put','/giao-dich/'+created.body.giaoDich.id,{soTien:25000})).status).toBe(200);
const filtered=await call(a,'get','/giao-dich?danhMuc='+custom.ma);expect(filtered.body.giaoDichs).toHaveLength(1);expect(filtered.body.giaoDichs[0].soTien).toBe(25000);
expect((await call(a,'put','/giao-dich/'+created.body.giaoDich.id,{loai:'thu'})).status).toBe(400);
});
test('custom expense budget counts spending and notifications use the custom name',async()=>{const now=new Date(Date.now()+7*3600000);const body={danhMuc:custom.ma,soTienToiDa:10000,thang:now.getUTCMonth()+1,nam:now.getUTCFullYear()};
expect((await call(a,'post','/ngan-sach',body)).status).toBe(200);expect((await call(b,'post','/ngan-sach',body)).status).toBe(400);
const notifications=await request(app).get('/api/thong-bao').set('Authorization','Bearer '+a.token);expect(notifications.body.thongBaos.some(n=>n.tieuDe==='Vượt ngân sách: Mua sách')).toBe(true);
});
test('custom income cannot be used as an expense or expense budget',async()=>{const income=(await call(a,'post','/danh-muc',{loai:'thu',ten:'Bán đồ cũ'})).body.danhMuc;
expect((await call(a,'post','/giao-dich',{loai:'thu',danhMuc:income.ma,soTien:10000})).status).toBe(201);expect((await call(a,'post','/giao-dich',{loai:'chi',danhMuc:income.ma,soTien:10000})).status).toBe(400);
});
test('Excel exports category names and exact amounts rather than opaque category codes',async()=>{
const res=await request(app).get('/api/finance/xuat-bao-cao').set('Authorization','Bearer '+a.token).buffer(true).parse((response,done)=>{const chunks=[];response.on('data',c=>chunks.push(c));response.on('end',()=>done(null,Buffer.concat(chunks)));});
expect(res.status).toBe(200);const book=new ExcelJS.Workbook();await book.xlsx.load(res.body);const rows=[];book.getWorksheet('Chi tiết giao dịch').eachRow(row=>rows.push(row.values));expect(rows.some(row=>row.includes('Mua sách')&&row.includes(25000))).toBe(true);expect(JSON.stringify(rows)).not.toContain(custom.ma);
});
