import { test, expect } from './fixtures.js';
test('mobile bottom navigation, balanced finance controls and manual deadline recovery', async ({session: page, account}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/tai-chinh');
  const nav=page.getByRole('navigation',{name:'Điều hướng dưới trên điện thoại'});
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link')).toHaveCount(6);
  const a=await page.getByRole('button',{name:'Xuất Excel',exact:true}).boundingBox();
  const b=await page.getByRole('button',{name:'Quét hóa đơn',exact:true}).boundingBox();
  expect(Math.abs(a.width-b.width)).toBeLessThan(2);expect(a.y).toBe(b.y);
  const period=await page.getByLabel('Tháng/năm tài chính').boundingBox();expect(period.width).toBeGreaterThan(220);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'../docs/qa/mobile-finance-20261030.png',fullPage:true});
  const task=(await account.api('POST','/deadline',{tieuDe:'Xóa tay rồi khôi phục',hanChot:'2026-11-10',doUuTien:'thap'})).deadline;
  await account.api('DELETE','/deadline/'+task.id);
  await nav.getByRole('link',{name:'Deadline',exact:true}).click();
  const trash=page.locator('details').filter({hasText:'Đã xóa ('});
  await trash.locator('summary').click();
  await expect(trash).toContainText('Xóa tay rồi khôi phục');
  await trash.getByRole('button',{name:/Khôi phục/}).click();
  await expect(page.getByText('Cần hoàn thành (1)',{exact:true})).toBeVisible();
  await page.screenshot({path:'../docs/qa/mobile-deadline-20261030.png',fullPage:true});
});

