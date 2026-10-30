
const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto'),ExcelJS=require('exceljs');
const app=require('../../app'),prisma=require('../../src/prismaClient');
let a,b;const ids=[];
const call=(u,method,url,body)=>{const req=request(app)[method]('/api/finance'+url).set('Authorization','Bearer '+u.token);return body?req.send(body):req;};
const makeCategory=async(u,name='Mua sách')=>(await call(u,'post','/danh-muc',{loai:'chi',ten:name})).body.danhMuc;
beforeAll(async()=>{const db=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(db.hostname)||!db.pathname.endsWith('_test'))throw Error('Isolated test database required');
const make=async()=>{const user=await prisma.nguoiDung.create({data:{ten:'Archive test',email:randomUUID()+'@example.invalid',matKhau:'test-only'}});ids.push(user.id);return {...user,token:jwt.sign({id:user.id,matKhauDoiLuc:user.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await make();b=await make();});
afterAll(async()=>{if(ids.length)await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('category removal requires authentication and can archive starter categories',async()=>{
expect((await request(app).delete('/api/finance/danh-muc/an_uong')).status).toBe(401);
for(const ma of ['an_uong','di_lai','khac'])expect((await call(a,'delete','/danh-muc/'+ma)).status).toBe(200);
});
test('only owner can remove custom category; repeated removal is harmless',async()=>{
const c=await makeCategory(a,'Đồ dùng');
expect((await call(b,'delete','/danh-muc/'+c.ma)).status).toBe(404);
expect((await call(a,'delete','/danh-muc/'+c.ma)).body.danhMuc).toMatchObject({ma:c.ma,daAn:true,coTheXoa:false});
expect((await call(a,'delete','/danh-muc/'+c.ma)).status).toBe(200);
const list=(await call(a,'get','/danh-muc')).body.danhMucs;expect(list.find(item=>item.ma===c.ma).daAn).toBe(true);
});
test('removal preserves transaction/budget names and totals including editing an old transaction',async()=>{
const c=await makeCategory(a),now=new Date(Date.now()+7*3600000);
const created=await call(a,'post','/giao-dich',{loai:'chi',danhMuc:c.ma,soTien:20000,moTa:'Sách đã mua'});
const gd=created.body.giaoDich;
const body={danhMuc:c.ma,soTienToiDa:10000,thang:now.getUTCMonth()+1,nam:now.getUTCFullYear()};
expect((await call(a,'post','/ngan-sach',body)).status).toBe(200);
expect((await call(a,'delete','/danh-muc/'+c.ma)).status).toBe(200);
expect((await call(a,'get','/giao-dich?danhMuc='+c.ma)).body.giaoDichs[0]).toMatchObject({danhMuc:c.ma,soTien:20000});
expect((await call(a,'put','/giao-dich/'+gd.id,{moTa:'Đã đối chiếu'})).status).toBe(200);
const budget=await prisma.nganSach.findFirst({where:{idNguoiDung:a.id,danhMuc:c.ma}});expect(budget.soTienToiDa).toBe(10000);
const notes=await request(app).get('/api/thong-bao').set('Authorization','Bearer '+a.token);expect(notes.body.thongBaos.some(n=>n.tieuDe==='Vượt ngân sách: Mua sách')).toBe(true);
const response=await request(app).get('/api/finance/xuat-bao-cao').set('Authorization','Bearer '+a.token).buffer(true).parse((res,done)=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>done(null,Buffer.concat(chunks)));});
const book=new ExcelJS.Workbook();await book.xlsx.load(response.body);const rows=[];book.getWorksheet('Chi tiết giao dịch').eachRow(row=>rows.push(row.values));expect(rows.some(row=>row.includes('Mua sách')&&row.includes(20000))).toBe(true);
});
test('adding same normalized name restores the category with the same code and previous history',async()=>{
const before=await prisma.danhMucTaiChinh.findFirst({where:{idNguoiDung:a.id,ten:'Mua sách'}});
const restored=await makeCategory(a,'mua sach');
expect(restored).toMatchObject({ma:before.ma,ten:'Mua sách',daAn:false,coTheXoa:true});
expect(await prisma.danhMucTaiChinh.count({where:{idNguoiDung:a.id,ma:before.ma}})).toBe(1);
expect(await prisma.giaoDich.count({where:{idNguoiDung:a.id,danhMuc:before.ma}})).toBe(1);
});
test('archived categories free an active slot without erasing names',async()=>{
await prisma.danhMucTaiChinh.deleteMany({where:{idNguoiDung:b.id}});
await prisma.danhMucTaiChinh.createMany({data:Array.from({length:50},(_,i)=>({idNguoiDung:b.id,loai:'chi',ma:'custom_'+randomUUID(),ten:'Danh mục '+i,tenChuanHoa:'danh muc '+i}))});
expect((await call(b,'post','/danh-muc',{loai:'chi',ten:'Mới'})).status).toBe(400);
const first=await prisma.danhMucTaiChinh.findFirst({where:{idNguoiDung:b.id}});
expect((await call(b,'delete','/danh-muc/'+first.ma)).status).toBe(200);
expect((await call(b,'post','/danh-muc',{loai:'chi',ten:'Mới'})).status).toBe(201);
expect(await prisma.danhMucTaiChinh.count({where:{idNguoiDung:b.id,daAn:false}})).toBe(50);
});
