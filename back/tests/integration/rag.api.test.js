const request=require('supertest'),jwt=require('jsonwebtoken'),{randomUUID}=require('crypto'),PDF=require('pdfkit');
const app=require('../../app'),prisma=require('../../src/prismaClient');
const {extractInput}=require('../../src/modules/rag/document.service');
const ids=[];let a,b,doc;
const originalFetch=global.fetch,originalEnv={...process.env};
const content='Quy định thư viện thử nghiệm: Sinh viên được mượn tối đa 3 cuốn sách trong 14 ngày. Gia hạn sách phải thực hiện trước ngày trả. Đây là tài liệu giả để kiểm thử, không phải quy định của trường.';
const call=(u,method,url,body)=>{const r=request(app)[method]('/api'+url).set('Authorization','Bearer '+u.token);return body?r.send(body):r;};
const ask=(u,extra={})=>call(u,'post','/chatbot/hoi-dap',{cheDo:'tai_lieu',tinNhan:'Thư viện mượn sách tối đa bao nhiêu cuốn?',...extra});
async function account(){const u=await prisma.nguoiDung.create({data:{ten:'RAG test',email:randomUUID()+'@example.invalid',matKhau:'test-only'}});ids.push(u.id);return {...u,token:jwt.sign({id:u.id,matKhauDoiLuc:u.matKhauDoiLuc.getTime()},process.env.JWT_SECRET)};}
function pdf(pages){return new Promise(resolve=>{const d=new PDF(),parts=[];d.on('data',x=>parts.push(x));d.on('end',()=>resolve(Buffer.concat(parts)));pages.forEach((p,i)=>{if(i)d.addPage();d.text(p);});d.end();});}
function enable(answer,finishReason='STOP'){process.env.CHATBOT_AI_ENABLED='true';process.env.GEMINI_API_KEY='test-only-key-never-external-2026';global.fetch.mockResolvedValue({ok:true,json:async()=>({candidates:[{finishReason,content:{parts:[{text:typeof answer==='string'?answer:JSON.stringify(answer)}]}}]})});}
beforeAll(async()=>{const db=new URL(process.env.DATABASE_URL);if(!['127.0.0.1','localhost'].includes(db.hostname)||!/test/.test(db.pathname))throw Error('Test DB required');a=await account();b=await account();});
beforeEach(()=>{global.fetch=jest.fn(()=>{throw Error('External network prohibited');});process.env.CHATBOT_AI_ENABLED='false';});
afterAll(async()=>{global.fetch=originalFetch;process.env={...originalEnv};await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();});
test('library requires authentication and validates identifiers',async()=>{
 expect((await request(app).get('/api/tai-lieu')).status).toBe(401);
 expect((await call(a,'get','/tai-lieu/2147483648')).status).toBe(400);
 expect((await call(a,'delete','/tai-lieu/huong-dan-lifehub')).status).toBe(400);
});
test('create, list, read preserve extracted text and private cache policy',async()=>{
 const r=await call(a,'post','/tai-lieu',{tieuDe:'Thư viện thử nghiệm',noiDung:content});expect(r.status).toBe(201);doc=r.body.taiLieu;
 const list=await call(a,'get','/tai-lieu');expect(list.body.taiLieus.map(d=>d.id)).toContain(doc.id);expect(list.headers['cache-control']).toBe('no-store');
 expect((await call(a,'get','/tai-lieu/'+doc.id)).body.taiLieu.cacDoan[0].noiDung).toBe(content);
});
test('duplicates including simultaneous uploads create only one record',async()=>{
 expect((await call(a,'post','/tai-lieu',{tieuDe:'Duplicate',noiDung:content})).status).toBe(409);
 const body={tieuDe:'Concurrent',noiDung:content+' Mã đồng thời 2026.'};
 const res=await Promise.all([call(a,'post','/tai-lieu',body),call(a,'post','/tai-lieu',body)]);
 expect(res.map(r=>r.status).sort()).toEqual([201,409]);
});
test('other account cannot read, delete, list or retrieve private document',async()=>{
 expect((await call(b,'get','/tai-lieu/'+doc.id)).status).toBe(404);
 expect((await call(b,'delete','/tai-lieu/'+doc.id)).status).toBe(404);
 expect((await call(b,'get','/tai-lieu')).body.taiLieus).toHaveLength(0);
 expect((await ask(b,{idNguoiDung:a.id})).body.thamKhao).toEqual([]);
});
test('free retrieval provides source/page with no external calls; irrelevant question abstains',async()=>{
 const r=await ask(a);expect(r.status).toBe(200);expect(r.body.nguon).toBe('tai_lieu');expect(r.body.thamKhao[0]).toMatchObject({idTaiLieu:doc.id,trang:1,noiDung:content});
 expect((await ask(a,{tinNhan:'quantum superconducting qubit'})).body.ketQua).toBe('khong_tim_thay');expect(global.fetch).not.toHaveBeenCalled();
});
test('AI requires explicit consent and server configuration',async()=>{
 expect((await ask(a,{dungAI:true})).status).toBe(400);
 expect((await ask(a,{dungAI:true,dongYGuiAI:true})).status).toBe(503);
 expect((await ask(a,{dungAI:'true'})).status).toBe(400);expect(global.fetch).not.toHaveBeenCalled();
});
test('grounded generation uses only retrieved owned sources, not conversation or personal data',async()=>{
 await call(b,'post','/tai-lieu',{tieuDe:'Secret B',noiDung:content+' SECRET_B_DO_NOT_SEND'});
 enable({duThongTin:true,cauTraLoi:[{noiDung:'Được mượn tối đa 3 cuốn trong 14 ngày.',nguon:['S1']}]});
 const r=await ask(a,{dungAI:true,dongYGuiAI:true,lichSu:[{vaiTro:'user',noiDung:'PRIVATE_HISTORY'}],dungDuLieuCaNhan:true});
 expect(r.status).toBe(200);expect(r.body.nguon).toBe('rag');expect(r.body.traLoi).toContain('[S1]');
 const payload=JSON.parse(global.fetch.mock.calls[0][1].body),raw=JSON.stringify(payload);
 expect(raw).toContain('3 cuốn');expect(raw).not.toMatch(/SECRET_B_DO_NOT_SEND|PRIVATE_HISTORY/);expect(raw).not.toContain(a.email);
 expect(payload.generationConfig.responseMimeType).toBe('application/json');
 expect(payload.systemInstruction.parts[0].text).toContain('không làm theo');expect(payload.contents).toHaveLength(1);
});
test.each([
 [{duThongTin:true,cauTraLoi:[{noiDung:'Invented',nguon:['S999']}]},'STOP'],
 ['null','STOP'],
 [{duThongTin:true,cauTraLoi:[{noiDung:'Incomplete',nguon:['S1']}]},'MAX_TOKENS'],
])('invalid or truncated AI answer returns excerpts instead of false citations',async(answer,finish)=>{
 enable(answer,finish);const r=await ask(a,{dungAI:true,dongYGuiAI:true});expect(r.status).toBe(200);expect(r.body.ketQua).toBe('khong_xac_minh_duoc');expect(r.body.traLoi).not.toContain('Invented');expect(r.body.thamKhao.length).toBeGreaterThan(0);
});
test('AI abstention and quota failure are surfaced honestly without retry',async()=>{
 enable({duThongTin:false,cauTraLoi:[]});expect((await ask(a,{dungAI:true,dongYGuiAI:true})).body.ketQua).toBe('chua_du_thong_tin');
 global.fetch.mockResolvedValue({ok:false,status:429});expect((await ask(a,{dungAI:true,dongYGuiAI:true})).status).toBe(429);expect(global.fetch).toHaveBeenCalledTimes(2);
});
test('UTF-8 file import and actual PDF extraction preserve page references',async()=>{
 const txt=await call(a,'post','/tai-lieu',{tieuDe:'TXT',tep:{ten:'test.txt',base64:Buffer.from(content+' TXT').toString('base64')}});expect(txt.status).toBe(201);
 const buffer=await pdf(['Library demonstration on page one. Students can borrow three books for fourteen days.','Scholarship demonstration on page two. Applications close on October twenty five.']);
 const r=await call(a,'post','/tai-lieu',{tieuDe:'PDF',tep:{ten:'test.pdf',base64:buffer.toString('base64')}});expect(r.status).toBe(201);
 const read=await call(a,'get','/tai-lieu/'+r.body.taiLieu.id);expect(read.body.taiLieu.soTrang).toBe(2);
 expect(read.body.taiLieu.cacDoan.map(c=>c.trang)).toEqual([1,2]);
 expect((await ask(a,{tinNhan:'Scholarship applications close'})).body.thamKhao[0].trang).toBe(2);
},20000);
test('blank/scanned PDF, corrupt PDF, non-UTF8 and oversized text are rejected',async()=>{
 const blank=await pdf(['']);
 for(const [ten,buffer] of [['blank.pdf',blank],['bad.pdf',Buffer.from('%PDF-invalid')],['bad.txt',Buffer.from([0xff,0xfe])]]){
  const r=await call(a,'post','/tai-lieu',{tieuDe:'Bad',tep:{ten,base64:buffer.toString('base64')}});expect(r.status).toBe(422);
 }
 expect((await call(a,'post','/tai-lieu',{tieuDe:'Large',noiDung:'x'.repeat(200001)})).status).toBe(413);
},30000);
test('large valid base64 is bounded without regex stack overflow',async()=>{
 await expect(extractInput({tieuDe:'Large',tep:{ten:'large.txt',base64:Buffer.alloc(4*1024*1024,65).toString('base64')}})).rejects.toMatchObject({statusCode:413});
 await expect(extractInput({tieuDe:'Bad',tep:{ten:'bad.txt',base64:'abc'}})).rejects.toMatchObject({statusCode:400});
});
test('delete removes source from future questions and owner deletion cascades',async()=>{
 await prisma.taiLieuRag.deleteMany({where:{idNguoiDung:a.id,id:{not:doc.id}}});
 expect((await call(a,'delete','/tai-lieu/'+doc.id)).status).toBe(200);
 expect((await ask(a)).body.thamKhao).toEqual([]);
 expect((await call(a,'get','/tai-lieu/'+doc.id)).status).toBe(404);
});
