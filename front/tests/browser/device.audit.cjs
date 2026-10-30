const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'../../..'),dist=path.join(root,'front/dist'),out=path.join(root,'improvement-backups/device-audit-20261025');
fs.mkdirSync(out,{recursive:true});
process.env.DATABASE_URL=process.env.SLH_DEVICE_TEST_DATABASE_URL || 'postgresql://slh_device_test@127.0.0.1:55446/slh_device_test?schema=public';
const testDB=new URL(process.env.DATABASE_URL);if(!['127.0.0.1','localhost'].includes(testDB.hostname)||!testDB.pathname.endsWith('_test'))throw Error('An isolated local *_test database is required');
process.env.JWT_SECRET='isolated-device-test-20261025-not-production';process.env.NODE_ENV='test';process.env.ENABLE_CRON_JOBS='false';process.env.SERVE_FRONTEND='false';process.env.CHATBOT_AI_ENABLED='false';
global.fetch=async()=>{throw Error('External model calls prohibited');};
require(path.join(root,'back/src/constants')).RATE_LIMIT.GLOBAL_MAX=3000;
const app=require(path.join(root,'back/app')),prisma=require(path.join(root,'back/src/prismaClient'));
const {chromium}=require(process.env.SLH_PLAYWRIGHT_MODULE || 'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const checks=[],failures=[],errors=[],ids=[];let browser,page;
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname.startsWith('/api/'))return app(req,res);let f=path.resolve(dist,'.'+u.pathname);if(!f.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(dist,'index.html');res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
async function check(name,fn){console.log('CHECK',name);try{const detail=await fn();checks.push({name,passed:true,detail});}catch(e){const item={name,passed:false,error:e.message};checks.push(item);failures.push(item);console.log('FAILED',name,e.message);if(page)await page.screenshot({path:path.join(out,'failure-'+failures.length+'.png'),fullPage:true});}}
function expect(v,message){if(!v)throw Error(message);}
async function layout(){return page.evaluate(()=>{const w=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>w+2&&getComputedStyle(e).position!=='absolute';}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,55),right:e.getBoundingClientRect().right}));return {client:w,scroll:document.documentElement.scrollWidth,bad};});}
async function noOverflow(){const l=await layout();expect(l.scroll<=l.client+2,JSON.stringify(l));
 if(page.url().endsWith('/thoi-khoa-bieu')&&l.client<768){const off=await page.locator('button[aria-label^="Sửa buổi học"],button[aria-label^="Xóa buổi học"]').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<0||r.right>document.documentElement.clientWidth+1);}));expect(!off.length,'Timetable edit/delete controls are clipped');}
 return l;}
(async()=>{try{
 const bcrypt=require(path.join(root,'back/node_modules/bcryptjs')),password='Device-test-only-2026';
 const a=await prisma.nguoiDung.create({data:{ten:'Sinh viên kiểm thử thiết bị với tên dài',email:'device-'+Date.now()+'@example.invalid',matKhau:await bcrypt.hash(password,10)}});ids.push(a.id);
 const long='Tênmônhọcdàikhôngcódấucách'.repeat(5).slice(0,100),room='Phònghọcdàikhôngcódấucách'.repeat(3).slice(0,50);
 await prisma.monHoc.create({data:{idNguoiDung:a.id,ten:long,tinChi:3,hocKy:'HK1-2026',diems:{create:{loaiDanhGia:'Đánhgiákhôngcódấucách'.repeat(3),diem:8,trongSo:40}}}});
 await prisma.deadline.create({data:{idNguoiDung:a.id,tieuDe:'Deadlinekhôngcódấucách'.repeat(7),hanChot:new Date(Date.now()+86400000)}});
 for(const thu of [2,5,8])await prisma.thoiKhoaBieu.create({data:{idNguoiDung:a.id,tenMon:long,thu,gioBatDau:'07:00',gioKetThuc:'09:00',phongHoc:room,giangVien:'Giảngviêndàikhôngcódấucách'.repeat(3).slice(0,100),hocKy:'HK1-2026'}});
 await prisma.giaoDich.create({data:{idNguoiDung:a.id,loai:'chi',danhMuc:'an_uong',soTien:123456789,moTa:'Nộidunggiaodịchkhôngcódấucách'.repeat(8)}});
 await new Promise(ok=>server.listen(5093,'127.0.0.1',ok));
 browser=await chromium.launch({executablePath:process.env.SLH_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900},locale:'vi-VN',reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page=await context.newPage();page.setDefaultTimeout(7000);page.setDefaultNavigationTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5093/login');await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/dashboard',{timeout:12000});await page.waitForLoadState('networkidle');
 const pages=['dashboard','mon-hoc','deadline','thoi-khoa-bieu','tai-chinh','ho-so','tai-lieu'];
 for(const width of [320,360,390,640,768,1280]){
  await page.setViewportSize({width,height:844});
  for(const route of pages)await check(width+'px '+route+' populated long text',async()=>{
   await page.goto('http://127.0.0.1:5093/'+route);await page.waitForLoadState('networkidle');return noOverflow();
  });
 }
 await page.setViewportSize({width:320,height:568});
 const forms=[
  ['mon-hoc','Thêm môn học'],
  ['deadline','Thêm Deadline'],
  ['thoi-khoa-bieu','Thêm buổi học'],
  ['tai-chinh','Thêm giao dịch'],
 ];
 for(const [route,label]of forms)await check('320px '+route+' form controls',async()=>{
  await page.goto('http://127.0.0.1:5093/'+route);await page.waitForLoadState('networkidle');
  let button=page.getByRole('button',{name:label,exact:true});if(!await button.count()&&route==='deadline')button=page.getByRole('button',{name:/Thêm.*(việc|deadline)/i}).first();
  await button.first().click();await page.waitForTimeout(100);const info=await noOverflow();
  const clipped=await page.locator('main input,main select,main textarea,main form button').evaluateAll(elements=>elements.filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;let p=e.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p),pr=p.getBoundingClientRect();if(['hidden','clip'].includes(s.overflowX)&&(r.left<pr.left-2||r.right>pr.right+2))return true;p=p.parentElement;}return false;}).map(e=>({tag:e.tagName,id:e.id,text:e.textContent.slice(0,35)})));
  expect(!clipped.length,'Clipped form controls '+JSON.stringify(clipped));return info;
 });
 for(const height of [844,420,300])await check('Chat document mode height '+height,async()=>{
  await page.setViewportSize({width:390,height});await page.goto('http://127.0.0.1:5093/dashboard');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Mở trợ lý LifeHub'}).click();await page.getByRole('button',{name:'Hỏi tài liệu',exact:true}).click();
  const send=await page.getByRole('button',{name:'Gửi tin nhắn'}).boundingBox(),close=await page.getByRole('button',{name:'Đóng trợ lý'}).boundingBox();
  expect(send&&send.y>=0&&send.y+send.height<=height,'Send control outside viewport '+JSON.stringify(send));
  expect(close&&close.y>=0&&close.y+close.height<=height,'Close control outside viewport '+JSON.stringify(close));
  await noOverflow();if(height===300)await page.screenshot({path:path.join(root,'docs/qa/device-chat-short.png')});return {send,close};
 });
 await check('Chat returns keyboard focus after Escape',async()=>{
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5093/dashboard');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Mở trợ lý LifeHub'}).click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Mở trợ lý LifeHub');
 });
 await check('Toast readable width and close target',async()=>{
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5093/tai-lieu');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Thêm tài liệu',exact:true}).click();await page.getByLabel('Tên tài liệu',{exact:true}).fill('Kiểm thử thông báo');
  await page.getByLabel('Hoặc dán nội dung').fill('Nội dung tài liệu dùng riêng để kiểm thử hiển thị thông báo trên màn hình hẹp.');await page.getByRole('button',{name:'Lưu tài liệu',exact:true}).click();
  const toast=page.locator('[role=status]').filter({hasText:'Đã thêm tài liệu'});await toast.waitFor();const r=await toast.boundingBox();expect(r.width>=280&&r.width<=374,'Toast too narrow '+JSON.stringify(r));const close=await toast.getByRole('button',{name:'Đóng thông báo'}).boundingBox();expect(close.width>=44&&close.height>=44,'Toast close target too small');await page.screenshot({path:path.join(root,'docs/qa/device-toast-mobile.png')});await toast.getByRole('button',{name:'Đóng thông báo'}).click();await toast.waitFor({state:'hidden'});return r;
 });

 for(const route of pages)await check('390px dark '+route,async()=>{
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5093/'+route);await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Chuyển sang giao diện tối'}).click().catch(()=>{});
  await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));return noOverflow();
 });
 const touch=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,storageState:await context.storageState(),locale:'vi-VN',reducedMotion:'reduce',serviceWorkers:'block'});
 await touch.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page=await touch.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
 await check('Touch emulation: long timetable actions remain tappable',async()=>{
  await page.goto('http://127.0.0.1:5093/thoi-khoa-bieu');await page.waitForLoadState('networkidle');
  await noOverflow();const edit=page.locator('button[aria-label^="Sửa buổi học"]:visible').first();await edit.tap();await page.locator('#tkb-phong-hoc').waitFor();expect(await page.locator('#tkb-ten-mon').getAttribute('maxlength')==='100','Name limit missing');expect(await page.locator('#tkb-phong-hoc').getAttribute('maxlength')==='50','Room limit missing');await page.locator('#tkb-phong-hoc').fill('B201');
  await page.getByRole('button',{name:'Cập nhật',exact:true}).tap();await page.locator('#tkb-phong-hoc').waitFor({state:'hidden'});
  expect(await prisma.thoiKhoaBieu.count({where:{idNguoiDung:a.id,phongHoc:'B201'}})===1,'Room was not saved');
  await page.screenshot({path:path.join(root,'docs/qa/device-timetable-touch.png')});
 });
 await check('Touch emulation: grouped money entry saves correct amount',async()=>{
  await page.goto('http://127.0.0.1:5093/tai-chinh');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).tap();
  await page.locator('#finance-amount').fill('100000');expect(await page.locator('#finance-amount').inputValue()==='100 000','Money grouping missing');
  await page.locator('#finance-desc').fill('Giao dịch thử bằng cảm ứng');
  expect(await page.locator('#finance-amount').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16),'Input font too small');
  await page.getByRole('button',{name:'Lưu giao dịch',exact:true}).tap();await page.locator('#finance-amount').waitFor({state:'hidden'});
  expect(await prisma.giaoDich.count({where:{idNguoiDung:a.id,moTa:'Giao dịch thử bằng cảm ứng',soTien:100000}})===1,'Incorrect saved amount');
 });

 const result={date:'2026-10-25',mode:'Production frontend + actual API + isolated PostgreSQL; viewport/touch emulation, not physical devices',testConfiguration:{globalRequestLimit:3000,reason:'Many reloads in a short visual audit; production rate limits remain unchanged',externalAICalls:0},checks,failures,errors};
 fs.writeFileSync(path.join(root,'docs/qa/2026-10-25-device-browser.json'),JSON.stringify(result,null,2));if(failures.length||errors.length)process.exitCode=1;console.log(JSON.stringify({checks:checks.length,failed:failures.length,errors}));
} catch(e){console.error(e.stack);process.exitCode=1;}finally{if(browser)await browser.close();if(ids.length)await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();server.close();}})();
