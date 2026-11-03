import { test, expect } from './fixtures.js';
test('mobile quick actions highlight only selected form and academic controls align',async({session:page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/dashboard');
 await expect(page.getByRole('button',{name:'Mở menu điều hướng',exact:true})).toHaveCount(0);
 const actions=page.locator('[aria-label="Thêm nhanh"]');
 for(const name of ['Thêm việc','Thêm lịch','Ghi khoản chi']){
  const button=actions.getByRole('button',{name,exact:true});await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  await expect(actions.locator('button[aria-pressed="true"]')).toHaveCount(1);
 }
 await page.screenshot({path:'../docs/qa/mobile-today-actions-20261030.png',fullPage:true});
 await page.getByRole('navigation',{name:'Điều hướng dưới trên điện thoại'}).getByRole('link',{name:'Học tập',exact:true}).click();
 const semester=page.getByRole('region',{name:'Thiết lập học kỳ'});await expect(semester).toBeVisible();
 expect((await semester.boundingBox()).height).toBeLessThan(110);
 const pdf=await page.getByRole('button',{name:'Xuất bảng điểm ra file PDF'}).boundingBox();
 const add=await page.getByRole('button',{name:'Thêm môn học',exact:true}).first().boundingBox();expect(add.width).toBeGreaterThan(pdf.width*1.8);
 await page.screenshot({path:'../docs/qa/mobile-study-controls-20261030.png',fullPage:true});
 await page.getByRole('navigation',{name:'Điều hướng dưới trên điện thoại'}).getByRole('link',{name:'Deadline',exact:true}).click();
 const list=await page.getByRole('button',{name:'Xem dạng danh sách'}).boundingBox();const calendar=await page.getByRole('button',{name:'Xem dạng lịch'}).boundingBox();expect(Math.abs(list.width-calendar.width)).toBeLessThan(2);
 await page.screenshot({path:'../docs/qa/mobile-deadline-controls-20261030.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('navigation',{name:'Điều hướng dưới trên điện thoại'}).locator('a[href="/thoi-khoa-bieu"]').click();
 const addClass=await page.getByRole('button',{name:'Thêm buổi học',exact:true}).first().boundingBox();
 const share=await page.getByRole('button',{name:'Chia sẻ TKB',exact:true}).boundingBox();
 expect(addClass.width).toBeGreaterThan(share.width*1.8);
 await page.screenshot({path:'../docs/qa/mobile-timetable-controls-20261103.png',fullPage:true});
});
