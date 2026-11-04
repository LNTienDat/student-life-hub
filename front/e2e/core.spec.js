import { test, expect } from './fixtures.js';
import { randomUUID } from 'node:crypto';

test('register, sign in, reload, sign out and browser Back protect private pages',async({page,account})=>{
 const email='register-'+randomUUID()+'@example.invalid';account.trackEmail(email);
 await page.goto('/register');
 await page.getByLabel('Họ tên',{exact:true}).fill('Registration E2E');
 await page.getByLabel('Email',{exact:true}).fill(email);
 await page.getByLabel('Mật khẩu',{exact:true}).fill(account.password);
 await page.getByLabel('Xác nhận mật khẩu',{exact:true}).fill(account.password);
 await page.getByRole('button',{name:'Đăng ký ngay',exact:true}).click();
 await expect(page).toHaveURL(/\/login$/);
 await page.getByLabel('Email',{exact:true}).fill(email);
 await page.getByLabel('Mật khẩu',{exact:true}).fill(account.password);
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page).toHaveURL(/\/dashboard$/);
 await page.reload();await expect(page.locator('main h1')).toContainText('Registration E2E');
 await page.getByRole('button',{name:'Đăng xuất khỏi tài khoản',exact:true}).click();
 await expect(page).toHaveURL(/\/login$/);
 await page.goBack();await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByLabel('Mật khẩu',{exact:true})).toBeVisible();
});

test('saved empty semester survives changes and explicit deletion',async({session:page,account})=>{
 await account.api('PUT','/auth/ho-so',{hocKyHienTai:'HK1 E2E'});
 await account.api('PUT','/auth/ho-so',{hocKyHienTai:'HK2 E2E'});
 await page.goto('/mon-hoc');await page.getByRole('button',{name:'Đổi học kỳ',exact:true}).click();
 await page.getByLabel('Chọn học kỳ đã lưu',{exact:true}).selectOption('HK1 E2E');
 await page.getByRole('button',{name:'Áp dụng học kỳ',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.reload();
 await expect(page.getByRole('region',{name:'Thiết lập học kỳ'})).toContainText('HK1 E2E');
 await page.getByRole('button',{name:'Đổi học kỳ',exact:true}).click();
 await page.getByRole('button',{name:'Xóa học kỳ đã chọn',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Xóa học kỳ?',exact:true});
 await dialog.getByLabel('Tên học kỳ xác nhận xóa').fill('HK1 E2E');
 await dialog.getByRole('button',{name:'Xóa học kỳ',exact:true}).click();
 await expect(dialog).toHaveCount(0);
 const profile=await account.api('GET','/auth/ho-so');
 expect(profile.user.hocKyDaLuu).toEqual(['HK2 E2E']);
 expect(profile.user.hocKyHienTai).toBe('');
});

test('grades reject 110 percent and accept 100 percent with GPA 9.20',async({session:page})=>{
 await page.goto('/mon-hoc');
 await page.getByRole('button',{name:'Thêm môn học',exact:true}).first().click();
 await page.getByLabel('Tên môn học',{exact:true}).fill('Kiểm thử E2E');
 await page.getByLabel('Tín chỉ',{exact:true}).fill('3');
 await page.getByLabel('Học kỳ',{exact:true}).fill('HK1 E2E');
 await page.getByRole('button',{name:'Lưu môn học',exact:true}).click();
 await page.getByRole('button',{name:'Thêm điểm cho môn Kiểm thử E2E',exact:true}).click();
 await page.getByLabel('Loại đánh giá').fill('Giữa kỳ');
 await page.getByLabel('Điểm số',{exact:true}).fill('8');
 await page.getByLabel('Trọng số phần trăm').fill('40');
 await page.getByRole('button',{name:'Lưu điểm',exact:true}).click();
 await page.getByRole('button',{name:'Thêm điểm cho môn Kiểm thử E2E',exact:true}).click();
 await page.getByLabel('Loại đánh giá').fill('Cuối kỳ');
 await page.getByLabel('Điểm số',{exact:true}).fill('10');
 const weight=page.getByLabel('Trọng số phần trăm');
 await weight.fill('70');
 expect(await weight.evaluate(el=>el.validity.rangeOverflow)).toBe(true);
 await page.getByRole('button',{name:'Lưu điểm',exact:true}).click();
 await expect(weight).toBeVisible();
 await weight.fill('60');await page.getByRole('button',{name:'Lưu điểm',exact:true}).click();
 await expect(page.getByLabel('Trọng số phần trăm')).toHaveCount(0);
 await expect(page.locator('main')).toContainText('9.20');
 await page.reload();await expect(page.locator('main')).toContainText('9.20');
});

test('timetable blocks overlapping classes and accepts a touching boundary',async({session:page,account})=>{
 await account.api('PUT','/auth/ho-so',{hocKyHienTai:'HK1 E2E'});
 await page.goto('/thoi-khoa-bieu');
 async function fill(name,start,end){
  await page.getByLabel('Tên môn học',{exact:true}).fill(name);
  await page.getByLabel('Thứ',{exact:true}).selectOption('2');
  await page.getByLabel('Giờ bắt đầu',{exact:true}).fill(start);
  await page.getByLabel('Giờ kết thúc',{exact:true}).fill(end);
 }
 await page.getByRole('button',{name:'Thêm buổi học',exact:true}).first().click();
 await fill('Toán E2E','07:00','09:00');
 await page.getByRole('button',{name:'Lưu buổi học',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Toán E2E',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Thêm buổi học',exact:true}).first().click();
 await fill('Lý E2E','08:00','10:00');
 await page.getByRole('button',{name:'Lưu buổi học',exact:true}).click();
 await expect(page.getByText(/Buổi học bị trùng giờ/)).toBeVisible();
 await fill('Lý E2E','09:00','10:00');
 await page.getByRole('button',{name:'Lưu buổi học',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Lý E2E',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Toán E2E',exact:true})).toBeVisible();
});

test('deadline completion and reopening stay consistent with Today',async({session:page})=>{
 await page.goto('/deadline');
 await page.getByRole('button',{name:'Thêm deadline',exact:true}).click();
 await page.getByLabel('Tên công việc',{exact:true}).fill('Nộp bài E2E');
 const tomorrow=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});});
 await page.getByLabel('Ngày hạn chót',{exact:true}).fill(tomorrow);
 await page.getByLabel('Độ ưu tiên',{exact:true}).selectOption('cao');
 await page.getByRole('button',{name:'Lưu công việc',exact:true}).click();
 await page.getByRole('button',{name:'Đánh dấu hoàn thành: Nộp bài E2E',exact:true}).click();
 await expect(page.getByRole('button',{name:'Đánh dấu chưa hoàn thành: Nộp bài E2E',exact:true})).toBeHidden();
 await page.locator('summary').filter({hasText:'Đã hoàn thành (1)'}).click();
 await expect(page.getByRole('button',{name:'Đánh dấu chưa hoàn thành: Nộp bài E2E',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Đánh dấu chưa hoàn thành: Nộp bài E2E',exact:true}).click();
 await page.getByRole('link',{name:'Hôm nay',exact:true}).first().click();
 await expect(page.locator('main')).toContainText('Nộp bài E2E');
 await expect(page.locator('main').getByRole('button',{name:/Hoàn thành/})).toHaveCount(0);
});

test('finance creates, edits and deletes exact dong amounts',async({session:page,account})=>{
 await page.goto('/tai-chinh');
 async function add(type,amount,desc){
  await page.getByRole('button',{name:'Thêm giao dịch',exact:true}).click();
  await page.getByLabel('Loại',{exact:true}).selectOption(type);
  await page.getByLabel('Số tiền (đồng)',{exact:true}).fill(amount);
  await page.getByLabel('Mô tả (Không bắt buộc)',{exact:true}).fill(desc);
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByLabel('Số tiền (đồng)',{exact:true})).toHaveCount(0);
 }
 await add('thu','100000','Thu E2E');await add('chi','20000','Chi E2E');
 let stats=await account.api('GET','/finance/thong-ke');
 expect(Number(stats.tongThu)).toBe(100000);expect(Number(stats.tongChi)).toBe(20000);
 await page.getByRole('button',{name:/Sửa giao dịch.*20.000/}).click();
 await page.getByLabel('Số tiền (đồng)',{exact:true}).fill('30000');
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.getByLabel('Số tiền (đồng)',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:/Xóa giao dịch.*30.000/}).click();
 await page.getByRole('alertdialog').getByRole('button',{name:'Xác nhận xóa',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toHaveCount(0);
 stats=await account.api('GET','/finance/thong-ke');expect(Number(stats.tongChi)).toBe(0);
 await page.reload();await expect(page.locator('main')).toContainText('100.000');
});

test('optional OCR failure preserves a reviewable unsaved draft',async({session:page,account})=>{
 await page.route(url=>url.pathname.includes('tesseract')&&url.pathname.endsWith('.js'),route=>route.fulfill({
  contentType:'application/javascript',body:`export const PSM={SINGLE_COLUMN:4,SINGLE_BLOCK:6};
export async function createWorker(languages){if(languages[0]==='eng')throw Error('simulated secondary download failure');return{setParameters:async()=>{},recognize:async()=>({data:{text:'CƠM SINH VIÊN\\nTổng tiền 20000'}}),terminate:async()=>{}};} export default {createWorker,PSM};`
 }));
 await page.goto('/tai-chinh');await page.getByRole('button',{name:'Quét hóa đơn',exact:true}).click();
 const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=300;canvas.height=200;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,300,200);return canvas.toDataURL().split(',')[1];});
 await page.getByLabel('Chọn ảnh hóa đơn',{exact:true}).setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await expect(page.getByLabel('Số tiền (đồng)',{exact:true})).toHaveValue('20 000');
 await expect(page.getByText(/Chưa đọc đối chiếu được/)).toBeVisible();
 await expect(page.getByText(/Chưa xác định chắc ngày giao dịch/)).toBeVisible();
 const list=await account.api('GET','/finance/giao-dich');expect(list.giaoDichs).toHaveLength(0);
});

test('main pages align their edges on desktop and narrow screens',async({session:page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/mon-hoc','/thoi-khoa-bieu','/dashboard','/deadline','/tai-chinh','/ho-so']){
   await page.goto(route);await expect(page.locator('main h1')).toBeVisible();
   const result=await page.evaluate(()=>{
    const main=document.querySelector('main'),rect=main.getBoundingClientRect(),style=getComputedStyle(main);
    const left=rect.left+parseFloat(style.paddingLeft),right=rect.right-parseFloat(style.paddingRight);
    return {aligned:[...main.querySelectorAll(':scope > div > .w-full')].every(el=>{const r=el.getBoundingClientRect();return Math.abs(r.left-left)<2&&Math.abs(r.right-right)<2;}),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(result.aligned,route+' at '+width).toBe(true);expect(result.overflow,route+' at '+width).toBe(false);
  }
 }
});
