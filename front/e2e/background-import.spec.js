import {test,expect} from './fixtures.js';
test('one chat preserves data and document questions; completed and trash panels match',async({session:page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/deadline');
 const completed=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Đã hoàn thành ('})});
 const trash=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Đã xóa ('})});
 const a=await completed.boundingBox(),b=await trash.boundingBox();
 expect(Math.abs(a.width-b.width)).toBeLessThan(2);expect(Math.abs(a.height-b.height)).toBeLessThan(2);
 await page.screenshot({path:'../docs/qa/deadline-panels-20261103.png',fullPage:true});
 await page.getByRole('button',{name:'Mở trợ lý LifeHub',exact:true}).click();
 await expect(page.getByRole('group',{name:'Chế độ trợ lý'})).toHaveCount(0);
 const input=page.getByRole('textbox',{name:'Câu hỏi cho trợ lý'});
 await input.fill('GPA hiện tại của mình?');await page.getByRole('button',{name:'Gửi tin nhắn'}).click();
 await expect(page.getByRole('log')).toContainText('Chưa có điểm để tính GPA.');
 await input.fill('Nhập thời khóa biểu từ ảnh ra sao?');await page.getByRole('button',{name:'Gửi tin nhắn'}).click();
 await expect(page.getByRole('log')).toContainText('Tra cứu tài liệu');
 await expect(page.getByRole('log')).toContainText('Chưa có điểm để tính GPA.');
 await page.screenshot({path:'../docs/qa/unified-chat-20261103.png',fullPage:true});
});

test('real timetable OCR continues across routes and retains the three editable sessions',async({session:page})=>{
 test.skip(!process.env.TEST_TIMETABLE_IMAGE,'Local opt-in real OCR sample');test.setTimeout(150000);
 await page.setViewportSize({width:390,height:844});await page.goto('/thoi-khoa-bieu');
 await page.getByRole('button',{name:'Nhập lịch từ ảnh',exact:true}).click();
 await page.getByLabel('Chọn ảnh thời khóa biểu',{exact:true}).setInputFiles(process.env.TEST_TIMETABLE_IMAGE);
 const nav=page.getByRole('navigation',{name:'Điều hướng dưới trên điện thoại'});
 await nav.locator('a[href="/mon-hoc"]').click();
 await expect(page.getByRole('link',{name:/Xem tiến trình|Kiểm tra và lưu/})).toBeVisible();
 await page.getByRole('link',{name:/Xem tiến trình|Kiểm tra và lưu/}).click();
 await expect(page.getByText('Đã nhận 3 buổi. Kiểm tra từng buổi trước khi lưu.',{exact:true})).toBeVisible({timeout:120000});
 const preview=page.getByRole('group',{name:'Chỉnh sửa lịch nhận diện'});
 await expect(preview.getByLabel('Tên môn',{exact:true})).toHaveCount(3);
 const names=await preview.getByLabel('Tên môn',{exact:true}).evaluateAll(nodes=>nodes.map(node=>node.value));
 expect(names.join(' ')).toMatch(/Python/);expect(names.join(' ')).toMatch(/Xử lý ảnh/);expect(names.join(' ')).toMatch(/UML/);
 await preview.getByLabel('Tên môn',{exact:true}).first().fill('Bản nháp đã sửa');
 await nav.locator('a[href="/tai-chinh"]').click();await nav.locator('a[href="/thoi-khoa-bieu"]').click();
 await expect(page.getByLabel('Tên môn',{exact:true}).first()).toHaveValue('Bản nháp đã sửa');
 await page.screenshot({path:'../docs/qa/background-import-20261103.png',fullPage:true});
});
