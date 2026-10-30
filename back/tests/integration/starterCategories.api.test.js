
const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto'),ExcelJS=require('exceljs');
const app=require('../../app'),prisma=require('../../src/prismaClient');let a,b;const ids=[];
const call=(u,method,path,body)=>{const r=request(app)[method]('/api/finance'+path).set('Authorization','Bearer '+u.token);return body?r.send(body):r;};
beforeAll(async()=>{const db=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(db.hostname)||!db.pathname.endsWith('_test'))throw Error('Isolated DB required');
const make=async()=>{const u=await prisma.nguoiDung.create({data:{ten:'Starter QA',email:randomUUID()+'@example.invalid',matKhau:'test'}});ids.push(u.id);return {...u,token:jwt.sign({id:u.id,matKhauDoiLuc:u.matKhauDoiLuc.getTime()},process.env.JWT_SECRET,{expiresIn:'10m'})};};a=await make();b=await make();});
afterAll(async()=>{await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('starter categories can be renamed and archived independently per account and transaction type',async()=>{
  for(const ma of ['an_uong','di_lai','khac'])expect((await call(a,'put','/danh-muc/'+ma,{loai:'chi',ten:'Chi '+ma})).status).toBe(200);
  expect((await call(a,'put','/danh-muc/khac',{loai:'thu',ten:'Quà tặng'})).status).toBe(200);
  const own=(await call(a,'get','/danh-muc')).body.danhMucs;expect(own.find(c=>c.ma==='khac'&&c.loai==='chi').ten).toBe('Chi khac');expect(own.find(c=>c.ma==='khac'&&c.loai==='thu').ten).toBe('Quà tặng');
  const other=(await call(b,'get','/danh-muc')).body.danhMucs;expect(other.filter(c=>c.ma==='khac').every(c=>c.ten==='Khác')).toBe(true);
  expect((await call(a,'delete','/danh-muc/khac?loai=chi')).status).toBe(200);
  expect((await call(a,'get','/danh-muc')).body.danhMucs.find(c=>c.ma==='khac'&&c.loai==='thu').daAn).toBe(false);
  const restored=(await call(a,'post','/danh-muc',{loai:'chi',ten:'Chi khac'})).body.danhMuc;expect(restored).toMatchObject({ma:'khac',loai:'chi',daAn:false});
});
test('all starter choices can be archived, restored and renamed without creating duplicate names',async()=>{
  for(const ma of ['an_uong','di_lai','khac'])expect((await call(b,'delete','/danh-muc/'+ma+'?loai=chi')).status).toBe(200);
  expect((await call(b,'get','/danh-muc')).body.danhMucs.filter(c=>c.loai==='chi'&&!c.daAn)).toHaveLength(0);
  expect((await call(b,'post','/danh-muc',{loai:'chi',ten:'Ăn uống'})).body.danhMuc).toMatchObject({ma:'an_uong',daAn:false});
  expect((await call(b,'put','/danh-muc/an_uong',{loai:'chi',ten:'Đi lại'})).status).toBe(409);
});
test('same legacy code uses the correct renamed type in search and Excel without losing old transactions',async()=>{
  await call(a,'post','/giao-dich',{loai:'chi',danhMuc:'khac',soTien:1000});await call(a,'post','/giao-dich',{loai:'thu',danhMuc:'khac',soTien:2000});
  const search=await call(a,'get','/giao-dich?q=qua%20tang');expect(search.body.giaoDichs).toHaveLength(1);expect(search.body.giaoDichs[0].loai).toBe('thu');
  const response=await call(a,'get','/xuat-bao-cao').buffer(true).parse((res,done)=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>done(null,Buffer.concat(chunks)));});
  const book=new ExcelJS.Workbook();await book.xlsx.load(response.body);const rows=[];book.getWorksheet('Chi tiết giao dịch').eachRow(row=>rows.push(row.values));
  expect(rows.some(row=>row.includes('Quà tặng')&&row.includes(2000))).toBe(true);expect(rows.some(row=>row.includes('Chi khac')&&row.includes(1000))).toBe(true);
});
