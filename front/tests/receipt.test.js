import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDong, extractReceipt, mergeReceiptReadings } from '../src/pages/taichinh/receiptUtils.js';
test('printed Vietnamese amount formats preserve exact integer dong; fractions and malformed separators stay unresolved',()=>{
  for(const value of ['20.000','20,000','20 000','20000','20.000,00','20,000.00','20000.00'])assert.equal(parseDong(value),20000);
  for(const value of ['20.00','20,50','-20000','20.00.000','NaN','0'])assert.equal(parseDong(value),null);
});
test('rice receipt extracts 20000 expense, date and food category without taking cash tender or change',()=>{
  const result=extractReceipt('CƠM SINH VIÊN\nHÓA ĐƠN\nNgày: 26/10/2026 12:30\nCơm gà 20.000\nTỔNG CỘNG 20.000 đ\nTiền khách đưa 50.000\nTiền thừa 30.000');
  assert.equal(result.soTien,'20000');assert.equal(result.danhMuc,'an_uong');assert.equal(result.ngayGiaoDich,'2026-10-26');assert.deepEqual(result.warnings,[]);
});
test('final payable total wins over item totals, subtotal and VAT lines',()=>{
  const result=extractReceipt('NHÀ HÀNG\nNgày 01/11/2026\nThành tiền 100.000\nTạm tính 100.000\nVAT 10% 10.000\nTỔNG THANH TOÁN 110.000\nKhách đưa 200.000\nTrả lại 90.000');
  assert.equal(result.soTien,'110000');assert.equal(result.ngayGiaoDich,'2026-11-01');
});
test('missing, conflicting and foreign-currency totals are not invented or converted',()=>{
  for(const text of ['Cơm 20.000\nNgày 26/10/2026','TỔNG CỘNG 20.000\nTỔNG CỘNG 30.000','TOTAL 20.00 USD','Tổng cộng -20.000','Tổng cộng 20k']){
    assert.equal(extractReceipt(text).soTien,'',text);
  }
  assert.equal(extractReceipt('TỔNG CỘNG\n20 000 VND').soTien,'20000');
});
test('receipt dates validate calendar days and reject conflicting dates; category remains editable suggestion',()=>{
  assert.equal(extractReceipt('TAXI\nNgày 29/02/2024\nTổng tiền 50.000').ngayGiaoDich,'2024-02-29');
  assert.equal(extractReceipt('TAXI\nNgày 29/02/2026\nTổng tiền 50.000').ngayGiaoDich,'');
  assert.equal(extractReceipt('Ngày 26/10/2026\nNgày 27/10/2026\nTOTAL 20000').ngayGiaoDich,'');
  assert.equal(extractReceipt('XĂNG DẦU\nTổng tiền 50000').danhMuc,'di_lai');
  assert.equal(extractReceipt('HIỆU SÁCH\nTổng tiền 50000').danhMuc,'khac');
});

test('restaurant bill supports abbreviated totals, quantity columns, cash payment and OCR fraction slashes',()=>{
  const receipt=extractReceipt('VINH NGUYEN RES\nNgày in: 29/03⁄2019\nT.Cộng     9       225,000\nTIỀN MẶT 225,000');
  assert.equal(receipt.soTien,'225000');assert.equal(receipt.ngayGiaoDich,'2019-03-29');assert.equal(receipt.danhMuc,'an_uong');
  assert.equal(extractReceipt('TIỀN MẶT\n225,000').soTien,'225000');
  assert.equal(extractReceipt('TỔNG CỘNG 20.000\nTIỀN MẶT 50.000\nTiền thừa 30.000').soTien,'20000');
});

test('Vietnamese printed month date and petrol VND totals remain readable',()=>{
 const coffee=extractReceipt('GÁI GARDEN COFFEE & TEA\nNgày: 07 thg 5, 2023\nTổng tiền: 1,916,000');
 assert.equal(coffee.ngayGiaoDich,'2023-05-07');assert.equal(coffee.soTien,'1916000');
 const petrol=extractReceipt('MUA XANG DAU\nNgày 17/04/2019\nVAT: VND 45,455.00\nTổng Cộng: VND 500,000.00\nThank for banking with us');
 assert.equal(petrol.soTien,'500000');assert.equal(petrol.danhMuc,'di_lai');
 assert.equal(petrol.ngayGiaoDich,'2019-04-17');assert.equal(petrol.warnings.length,0);
 const unknown=extractReceipt('Tổng tiền 20000');
 assert.equal(unknown.ngayGiaoDich,'');assert(unknown.warnings.some(w=>w.includes('ngày')));
 assert.equal(extractReceipt('Tổng tiền ¥ 20000').soTien,'');
 assert.equal(extractReceipt('Ngày 31 thg 2, 2023\nTổng tiền 20000').ngayGiaoDich,'');
});

test('OCR card masks and quantity artifacts are not foreign currency; final totals need agreement',()=>{
 const primary=extractReceipt('MUA XANG DAU\nNgay 17/04/2019\n$9 Luong Lit 24.65\nThanh Tien VND 380,581.00\nTong Dong WO 590, 000.00');
 assert(!primary.warnings.some(w=>w.includes('ngoại tệ')));
 const alternate=extractReceipt('So the 9704 15KK ¥¥kk 0407\nTong Cong: VND 500,000.00');
 assert.equal(alternate.soTien,'500000');
 assert.equal(mergeReceiptReadings(primary,[alternate,alternate]).soTien,'500000');
 const wrong=extractReceipt('Tong Cong VND 600,000.00');
 assert.equal(mergeReceiptReadings(wrong,[alternate,alternate]).soTien,'');
});

test('short Tong label with OCR border noise identifies final cafe total', () => {
 const r=extractReceipt('CÀ PHÊ HOÀNG PHÚC\nNgày: 18/02/2019\nCà phê đá 10,000\nẠ Tổng: 54,000');
 assert.equal(r.soTien,'54000');assert.equal(r.ngayGiaoDich,'2019-02-18');
 assert.equal(r.danhMuc,'an_uong');assert.equal(r.moTa,'CÀ PHÊ HOÀNG PHÚC');
 assert.equal(r.hasFinalTotal,true);
 assert.equal(extractReceipt('Tổng số lượng: 4\nCà phê 10,000').soTien,'');
 assert.equal(extractReceipt('Tổng: 54,000\nTổng: 55,000').soTien,'');
});
