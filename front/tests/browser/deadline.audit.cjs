const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),dist=path.join(root,'front/dist');
process.env.DATABASE_URL=process.env.SLH_DEADLINE_TEST_DATABASE_URL||'postgresql://slh_deadline_test@127.0.0.1:55448/slh_deadline_test?schema=public';
const db=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(db.hostname)||!db.pathname.endsWith('_test'))throw Error('Local isolated *_test database required');
process.env.JWT_SECRET='deadline-compact-browser-isolated-test-only';
process.env.NODE_ENV='test';process.env.ENABLE_CRON_JOBS='false';process.env.CHATBOT_AI_ENABLED='false';process.env.SERVE_FRONTEND='false';
global.fetch=async()=>{throw Error('No external AI or service calls');};
const app=require(path.join(root,'back/app')),prisma=require(path.join(root,'back/src/prismaClient'));
const {chromium}=require(process.env.SLH_PLAYWRIGHT_MODULE||'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const records=[],checks=[],ids=[],errors=[];let browser,page;
const mark=(name,detail)=>{checks.push({name,detail});console.log(name);};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){records.push({method:req.method,path:url.pathname});return app(req,res);}let file=path.resolve(dist,'.'+url.pathname);if(!file.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(dist,'index.html');res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);});
(async()=>{try{
 const bcrypt=require(path.join(root,'back/node_modules/bcryptjs')),password='Deadline-browser-only-2026';
 const user=await prisma.nguoiDung.create({data:{ten:'Sinh viên kiểm thử',email:'deadline-'+Date.now()+'@example.invalid',matKhau:await bcrypt.hash(password,10)}});ids.push(user.id);
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const dayAt=n=>new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)+n,16,59,59,999));
 const title='Nộp bài kiểm thử',task=await prisma.deadline.create({data:{idNguoiDung:user.id,tieuDe:title,hanChot:dayAt(1),doUuTien:'cao'}});
 await prisma.deadline.createMany({data:[
  {idNguoiDung:user.id,tieuDe:'Deadline ngày thứ ba',hanChot:dayAt(3)},
  {idNguoiDung:user.id,tieuDe:'Deadline sau bốn ngày',hanChot:dayAt(4)},
  {idNguoiDung:user.id,tieuDe:'Deadline đã quá hạn',hanChot:dayAt(-1)},
  {idNguoiDung:user.id,tieuDe:'Deadline đã xong',hanChot:dayAt(1),trangThai:'hoan_thanh'},
 ]});
 await prisma.monHoc.create({data:{idNguoiDung:user.id,ten:'Môn có điểm',tinChi:3,hocKy:'HK1-2026',diems:{create:{loaiDanhGia:'Thi',diem:8,trongSo:100}}}});
 await prisma.giaoDich.create({data:{idNguoiDung:user.id,loai:'chi',danhMuc:'an_uong',soTien:10000}});
 await prisma.deadline.create({data:{idNguoiDung:user.id,tieuDe:'Tiêuđềdàikhôngdấucách'.repeat(8),hanChot:new Date(Date.now()+30*86400000)}});
 await new Promise(ok=>server.listen(5096,'127.0.0.1',ok));
 browser=await chromium.launch({executablePath:process.env.SLH_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});
 await ctx.route('https://**/*',r=>r.abort());page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 const go=async(p,route)=>{await p.goto('http://127.0.0.1:5096/'+route);await p.waitForLoadState('networkidle');};
 await go(page,'login');await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/dashboard',{timeout:10000});
 await page.getByRole('link',{name:title,exact:true}).waitFor();await page.waitForLoadState('networkidle');
 assert.equal(await page.getByRole('button',{name:/biểu đồ/i}).count(),0);assert.equal(await page.locator('.recharts-wrapper').count(),0);
 assert.equal(records.some(r=>r.path==='/api/academic/gpa-theo-ky'),false);
 mark('Today has no chart controls or charts even with GPA and spending data; chart-only GPA request is removed');
 const summaryRow=t=>page.getByRole('listitem').filter({has:page.getByRole('link',{name:t,exact:true})});
 assert.equal(await summaryRow(title).getByRole('img',{name:'Cảnh báo: Đến hạn ngày mai',exact:true}).count(),1);
 assert.equal(await summaryRow('Deadline ngày thứ ba').getByRole('img',{name:'Cảnh báo: Còn 3 ngày',exact:true}).count(),1);
 assert.equal(await summaryRow('Deadline đã quá hạn').getByRole('img',{name:'Cảnh báo: Quá hạn',exact:true}).count(),1);
 assert.equal(await summaryRow('Deadline sau bốn ngày').getByRole('img').count(),0);
 assert.equal(await page.getByRole('link',{name:'Deadline đã xong',exact:true}).count(),0);
 mark('Only overdue and today-through-third-day deadlines have warning icons; fourth-day and completed tasks do not');
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(await page.locator('.deadline-alert').first().evaluate(e=>getComputedStyle(e,'::before').animationName),'deadline-alert-pulse');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.deadline-alert').first().evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
 mark('Alert halo animates with normal motion and stops under reduced motion');
 await page.screenshot({path:path.join(root,'docs/qa/dashboard-alert-desktop.png'),fullPage:true});
 await go(page,'tai-chinh');await page.locator('.recharts-wrapper').first().waitFor();mark('Finance detail page retains its chart');
 await go(page,'deadline');const row=page.getByRole('article').filter({has:page.getByRole('heading',{name:title,exact:true})});await row.waitFor();
 const box=await row.boundingBox();assert(box.height<=90,'Short desktop deadline row too tall: '+box.height);
 assert(await row.getByRole('button',{name:'Sửa deadline: '+title,exact:true}).isVisible());assert(await row.getByRole('button',{name:'Xóa deadline: '+title,exact:true}).isVisible());
 await page.screenshot({path:path.join(root,'docs/qa/dashboard-alert-list-desktop.png'),fullPage:true});mark('Short deadline is compact and edit/delete controls are visible without hover',{height:box.height});
 await row.getByRole('button',{name:'Đánh dấu hoàn thành: '+title,exact:true}).click();await page.getByRole('region',{name:'Công việc đã hoàn thành',exact:true}).getByRole('heading',{name:title,exact:true}).waitFor();
 assert.equal((await prisma.deadline.findUnique({where:{id:task.id}})).trangThai,'hoan_thanh');mark('Completing in Deadline updates both the displayed section and actual database');
 await go(page,'dashboard');assert.equal(await page.getByRole('link',{name:title,exact:true}).count(),0);mark('Completed work is absent from Today pending work');
 const second=await ctx.newPage();second.on('pageerror',e=>errors.push(e.message));second.setDefaultTimeout(10000);
 await go(second,'deadline');await second.getByRole('button',{name:'Đánh dấu chưa hoàn thành: '+title,exact:true}).click();await second.getByRole('region',{name:'Công việc cần hoàn thành',exact:true}).getByRole('heading',{name:title,exact:true}).waitFor();
 await page.bringToFront();await page.getByRole('link',{name:title,exact:true}).waitFor();
 const taskLink=page.getByRole('link',{name:title,exact:true});assert.equal(await page.getByRole('button',{name:'Đánh dấu hoàn thành: '+title,exact:true}).count(),0);assert.equal((await prisma.deadline.findUnique({where:{id:task.id}})).trangThai,'cho_xu_ly');
 mark('Undo in another tab restores the Today summary, which has no completion button');
 await page.reload();await taskLink.waitFor();assert.equal(await page.getByRole('button',{name:'Đánh dấu hoàn thành: '+title,exact:true}).count(),0);mark('Restored pending work survives reload and Today remains a read-only summary');
 await page.screenshot({path:path.join(root,'docs/qa/dashboard-alert-restored-desktop.png'),fullPage:true});
 const writes=()=>records.filter(r=>['POST','PUT','PATCH','DELETE'].includes(r.method)).length,beforeNavigation=writes();
 await taskLink.click();await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(writes(),beforeNavigation);
 await go(page,'dashboard');await taskLink.waitFor();await page.getByRole('link',{name:'Mở mục Deadline',exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(writes(),beforeNavigation);
 const n=()=>records.filter(r=>r.method==='PUT'&&r.path==='/api/deadline/'+task.id).length,baseline=n();
 await page.getByRole('button',{name:'Đánh dấu hoàn thành: '+title,exact:true}).evaluate(e=>{e.click();e.click();});
 await page.getByRole('region',{name:'Công việc đã hoàn thành',exact:true}).getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(n(),baseline+1);assert.equal((await prisma.deadline.findUnique({where:{id:task.id}})).trangThai,'hoan_thanh');
 mark('Today links only navigate without writes; completion is performed once inside Deadline');
 await go(page,'deadline');await page.getByRole('button',{name:'Đánh dấu chưa hoàn thành: '+title,exact:true}).click();await page.getByRole('region',{name:'Công việc cần hoàn thành',exact:true}).getByRole('heading',{name:title,exact:true}).waitFor();
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));const edit=await page.getByRole('button',{name:'Sửa deadline: '+title,exact:true}).boundingBox();assert(edit.x>=0&&edit.x+edit.width<=width&&edit.width>=44&&edit.height>=44);mark('Deadline actions fit '+width+'px with 44px touch targets');}
 await page.getByRole('button',{name:'Chuyển sang giao diện tối',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'docs/qa/dashboard-alert-list-mobile-dark.png'),fullPage:true});mark('Compact deadline list checked in mobile dark mode');
 await second.close();await go(page,'dashboard');await taskLink.waitFor();await page.screenshot({path:path.join(root,'docs/qa/dashboard-alert-mobile.png'),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));mark('Today remains readable at mobile width after undo');
 assert.deepEqual(errors,[]);mark('No browser JavaScript errors');
 fs.writeFileSync(path.join(root,'docs/qa/2026-10-25-dashboard-alert-browser.json'),JSON.stringify({date:'2026-10-25',mode:'Production frontend + real API + isolated PostgreSQL; synthetic account; no external AI/email',checks,errors},null,2));
 }catch(e){console.error(e.stack);if(page){await page.screenshot({path:path.join(root,'improvement-backups/deadline-compact-20261025/failure.png'),fullPage:true});console.error((await page.locator('body').innerText()).slice(-1600));}process.exitCode=1;}
 finally{if(browser)await browser.close();if(ids.length)await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();server.close();}})();
