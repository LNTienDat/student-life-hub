import {test,expect} from './fixtures.js';
import {localDateInput,shiftFinancePeriod} from '../src/pages/taichinh/financeUtils.js';

test('transaction time presets find previous-month and custom-year records independently of summary month',async({session:page,account})=>{
 await page.setViewportSize({width:390,height:844});
 const previous=shiftFinancePeriod(localDateInput().slice(0,7),-1);
 await account.api('POST','/finance/giao-dich',{loai:'chi',danhMuc:'an_uong',soTien:42000,moTa:'Giao dịch tháng trước',ngayGiaoDich:previous+'-05'});
 await account.api('POST','/finance/giao-dich',{loai:'thu',danhMuc:'khac',soTien:50000,moTa:'Lịch sử năm 2024',ngayGiaoDich:'2024-04-05'});
 await page.goto('/tai-chinh');
 const picker=page.getByRole('group',{name:'Chọn tháng giao dịch',exact:true}),rows=page.getByRole('list',{name:'Danh sách giao dịch'});
 await picker.getByRole('button',{name:'Tháng trước',exact:true}).click();await expect(rows).toContainText('Giao dịch tháng trước');await expect(rows).not.toContainText('Lịch sử năm 2024');
 await page.getByLabel('Tháng/năm tìm giao dịch',{exact:true}).fill('2024-04');
 await expect(rows).toContainText('Lịch sử năm 2024');await expect(rows).not.toContainText('Giao dịch tháng trước');
 await page.getByRole('button',{name:'Mọi thời gian',exact:true}).click();await expect(rows).toContainText('Giao dịch tháng trước');await expect(rows).toContainText('Lịch sử năm 2024');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.screenshot({path:'../docs/qa/finance-time-presets-20261104.png',fullPage:true});
});

test('compact priority filters clearly select one importance level',async({session:page,account})=>{
 for(const [tieuDe,doUuTien] of [['Việc nhẹ','thap'],['Việc gấp','cao']])await account.api('POST','/deadline',{tieuDe,doUuTien,hanChot:'2026-12-04T23:59:59+07:00'});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/deadline');
  const group=page.getByRole('group',{name:'Mức quan trọng',exact:true});
  await group.getByRole('button',{name:'Thấp',exact:true}).click();
  await expect(group.getByRole('button',{name:'Thấp',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Đánh dấu hoàn thành: Việc nhẹ',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Đánh dấu hoàn thành: Việc gấp',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  if(width===1440)await page.screenshot({path:'../docs/qa/deadline-filter-20261104.png',fullPage:true});
 }
});

test('finds a transaction recorded in the wrong year, corrects its date, clears filters and deletes it',async({session:page,account})=>{
 await page.setViewportSize({width:390,height:844});
 await account.api('POST','/finance/giao-dich',{loai:'chi',danhMuc:'an_uong',soTien:40000,moTa:'Bill ghi nhầm năm',ngayGiaoDich:'2024-04-05'});
 await page.goto('/tai-chinh');await page.getByLabel('Tháng/năm tài chính',{exact:true}).fill('2026-11');
 const rows=page.getByRole('list',{name:'Danh sách giao dịch'});
 await expect(page.getByText('Chưa có giao dịch trong tháng đã chọn',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Tìm trong mọi thời gian',exact:true}).click();
 await expect(rows).toContainText('Bill ghi nhầm năm');await expect(rows).toContainText('5/4/2024');
 await page.getByLabel('Tìm kiếm giao dịch',{exact:true}).fill('không tồn tại');
 await expect(page.getByText('Không tìm thấy giao dịch phù hợp',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Xóa từ khóa tìm kiếm',exact:true}).click();
 await expect(rows).toContainText('Bill ghi nhầm năm');
 await page.getByLabel('Lọc theo loại giao dịch',{exact:true}).selectOption('thu');
 await expect(rows).toHaveCount(0);
 await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();await expect(rows).toContainText('Bill ghi nhầm năm');
 await page.screenshot({path:'../docs/qa/mobile-all-time-search-20261104.png',fullPage:true});
 await rows.getByRole('button',{name:/Sửa giao dịch/}).click();
 await page.getByLabel('Ngày giao dịch',{exact:true}).fill('2026-11-04');
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.getByLabel('Ngày giao dịch',{exact:true})).toHaveCount(0);
 await page.getByLabel('Tháng/năm tìm giao dịch',{exact:true}).fill('2026-11');
 await expect(rows).toContainText('4/11/2026');
 await rows.getByRole('button',{name:/Xóa giao dịch/}).click();
 await page.getByRole('alertdialog').getByRole('button',{name:'Xác nhận xóa',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toHaveCount(0);
 const result=await account.api('GET','/finance/giao-dich');expect(result.giaoDichs).toHaveLength(0);
});

test('page names match navigation and semester settings follow the title on desktop and mobile',async({session:page})=>{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const [route,title] of [['/mon-hoc','Học tập'],['/thoi-khoa-bieu','Lịch học'],['/deadline','Deadline'],['/tai-chinh','Tài chính'],['/ho-so','Hồ sơ']]){
   await page.goto(route);const heading=page.getByRole('heading',{name:title,exact:true,level:1});await expect(heading).toBeVisible();
   const nav=page.getByRole('navigation',{name:width<1024?'Điều hướng dưới trên điện thoại':'Điều hướng chính'});
   await expect(nav.getByRole('link',{name:title,exact:true})).toHaveAttribute('aria-current','page');
   if(['/mon-hoc','/thoi-khoa-bieu'].includes(route)){
    const semester=page.getByRole('region',{name:'Thiết lập học kỳ'});await expect(semester).toBeVisible();
    const a=await heading.boundingBox(),b=await semester.boundingBox();expect(b.y).toBeGreaterThan(a.y+a.height);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
   if(width===390&&['/thoi-khoa-bieu','/ho-so'].includes(route))await page.screenshot({path:'../docs/qa/mobile-'+(route==='/ho-so'?'profile':'schedule')+'-20261104.png',fullPage:true});
  }
 }
});

test('completed deadlines remain compact and restorable, with matching closed section sizes',async({session:page,account})=>{
 await page.setViewportSize({width:390,height:844});
 await account.api('POST','/deadline',{tieuDe:'Việc đã xong',hanChot:'2026-11-04T23:59:59+07:00',doUuTien:'thap'});
 await page.goto('/deadline');
 await page.getByRole('button',{name:'Đánh dấu hoàn thành: Việc đã xong',exact:true}).click();
 const completed=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Đã hoàn thành (1)'})});
 const deleted=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Đã xóa (0)'})});
 await expect(completed).toBeVisible();const a=await completed.boundingBox(),b=await deleted.boundingBox();expect(Math.abs(a.height-b.height)).toBeLessThan(2);
 await completed.locator('summary').click();
 const row=completed.locator('article');await expect(row).toContainText('Việc đã xong');
 expect((await row.boundingBox()).height).toBeLessThan(115);
 await page.screenshot({path:'../docs/qa/mobile-completed-20261104.png',fullPage:true});
 await completed.getByRole('button',{name:'Đánh dấu chưa hoàn thành: Việc đã xong',exact:true}).click();
 await expect(page.getByRole('button',{name:'Đánh dấu hoàn thành: Việc đã xong',exact:true})).toBeVisible();
});
