import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDong, extractReceipt, mergeReceiptReadings, groupReceiptWords } from '../src/pages/taichinh/receiptUtils.js';
import { findReceiptPaper, sauvolaThreshold } from '../src/services/receiptPreprocess.js';
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

test('item table without total sums line amounts once and marks the result for review',()=>{
 const text='NHÀ HÀNG HACODE\nTên SL Đơn giá Thành tiền\nRau muống 1 10.000 10.000\nBò xào 1 30.000 30.000\nNgày 05/04/2019';
 const result=extractReceipt(text);
 assert.equal(result.soTien,'40000');assert.equal(result.ngayGiaoDich,'2019-04-05');
 assert.equal(result.computedFromItems,true);assert.equal(result.hasFinalTotal,false);
 assert(result.warnings.some(w=>w.includes('Tạm cộng')));
 const alternate=extractReceipt(text.replace('Tên SL','Ten 5'));
 assert.equal(mergeReceiptReadings(result,[alternate]).soTien,'40000');
 assert.equal(mergeReceiptReadings(result,[]).soTien,'');
 assert.equal(extractReceipt(text+'\nTổng thanh toán 45000').soTien,'45000');
 assert.equal(extractReceipt(text.replace('1 30.000 30.000','2 30.000 60.000')).soTien,'70000');
});

test('incomplete item tables, mismatched quantity and tax or discount need user review',()=>{
 const header='Tên SL Đơn giá Thành tiền\nRau 1 10.000 10.000\n';
 for(const row of ['Bò 30.000','Bò 2 30.000 50.000','Bò 1 30.000 30.000\nVAT 10%','Bò 1 30.000 30.000\nGiảm giá 5000'])assert.equal(extractReceipt(header+row).soTien,'',row);
 assert.equal(extractReceipt('Rau 1 10.000 10.000\nBò 1 30.000 30.000').soTien,'');
 const r=extractReceipt(header+'Bò 1 30.000 30.000');
 const conflicting=extractReceipt(header+'Bò 1 40.000 40.000');
 assert.equal(mergeReceiptReadings(r,[conflicting]).soTien,'');
});

test('2-digit receipt dates and discounted standalone Thanh toan totals are parsed accurately', () => {
  const shortDate = extractReceipt('QUAN CAFE\nNgày: 17/11/26\nTổng cộng 45.000');
  assert.equal(shortDate.ngayGiaoDich, '2026-11-17');
  assert.equal(shortDate.soTien, '45000');
  const discounted = extractReceipt('WINMART\nNgày 17/11/2026\nTổng cộng 100.000\nGiảm giá 20.000\nThanh toán: 80.000');
  assert.equal(discounted.soTien, '80000');
  assert.equal(discounted.danhMuc, 'an_uong');
});

test('dotted check-in dates and single noisy currency artifacts do not block multi-pass VND receipt totals', () => {
  const cleanSg = extractReceipt('SG COFFE\nGiờ vào: 11/02.16 20:31 Giờ ra: 11.02.16 22:33\nTổng cộng: 3.976.000\nThanh toán: 3.976.000');
  assert.equal(cleanSg.ngayGiaoDich, '2016-02-11');
  assert.equal(cleanSg.soTien, '3976000');
  assert.equal(cleanSg.danhMuc, 'an_uong');
  const noisy = extractReceipt('SC; CCDLEEL\nTổng cộng: 3.976.000\nThanh toán: 3.976.000\nL Lm ..Ị $3...');
  const merged = mergeReceiptReadings(cleanSg, [cleanSg, noisy]);
  assert.equal(merged.soTien, '3976000');
  assert.equal(merged.ngayGiaoDich, '2016-02-11');
});

test('groupReceiptWords keeps slightly tilted left label and right-aligned amount on the same row', () => {
  const rows = groupReceiptWords([{
    paragraphs: [{
      lines: [
        { words: [{ text: 'Tổng:', bbox: { x0: 20, x1: 75, y0: 200, y1: 214 } }] },
        { words: [{ text: '54,000', bbox: { x0: 240, x1: 310, y0: 192, y1: 206 } }] },
      ],
    }],
  }]);
  assert.equal(rows.length, 1);
  assert.equal(extractReceipt('CÀ PHÊ HOÀNG PHÚC\nNgày: 18/02/2019', rows).soTien, '54000');
});

test('parseDong and extractReceipt repair OCR digit noise, hyphen thousand separators, and damaged total labels', () => {
  assert.equal(parseDong('54,00O'), 54000);
  assert.equal(parseDong('5O.OOO'), 50000);
  assert.equal(parseDong('54-000'), 54000);
  assert.equal(parseDong('1-620-000'), 1620000);
  assert.equal(parseDong('-54,000'), null);
  assert.equal(parseDong('18-02-2019'), null);

  assert.equal(extractReceipt('CÀ PHÊ HOÀNG PHÚC\nNgày: 18/02/2019\nT6ng: 54,00O').soTien, '54000');
  assert.equal(extractReceipt('SG COFFE\nNgày: 11/02/2016\nT0ng c0ng: 54-000').soTien, '54000');
  assert.equal(extractReceipt('SG COFFE\nNgày: 11/02/2016\nTonq: 5O.OOO').soTien, '50000');
  assert.equal(extractReceipt('SG COFFE\nNgày: 11/02/2016\nGiảm giá: -50.000\nT.toán: 3.976-000').soTien, '3976000');
});

test('mergeReceiptReadings accepts a single unambiguous alternative total when primary missed it, while rejecting conflicts', () => {
  const missedPrimary = extractReceipt('SG COFFE\nGiờ vào: 11.02.16 20:31\nTRA GUNG');
  const recoveredAlt = extractReceipt('SG COFFE\nGiờ vào: 11.02.16 20:31\nTổng cộng: 3.976.000');
  const emptyAlt = extractReceipt('SG COFFE\nGiờ vào: 11.02.16 20:31');
  const merged = mergeReceiptReadings(missedPrimary, [recoveredAlt, emptyAlt]);
  assert.equal(merged.soTien, '3976000');
  assert.equal(merged.hasFinalTotal, true);

  const weakPrimary = extractReceipt('CÀ PHÊ HOÀNG PHÚC\nNgày: 18/02/2019\nThành tiền: 600,000');
  const conflictingAlt = extractReceipt('CÀ PHÊ HOÀNG PHÚC\nNgày: 18/02/2019\nTổng: 500,000');
  assert.equal(mergeReceiptReadings(weakPrimary, [conflictingAlt]).soTien, '');
});

test('findReceiptPaper extends cropping downward through shadowed receipt bottoms and still falls back on small spots', () => {
  const width = 200, height = 200;
  const fillBox = (buf, x0, x1, y0, y1, r, g, b) => {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
      }
    }
  };

  const shadowed = new Uint8ClampedArray(width * height * 4);
  fillBox(shadowed, 0, width, 0, height, 35, 40, 65);
  fillBox(shadowed, 35, 165, 15, 115, 210, 208, 205);
  fillBox(shadowed, 35, 165, 115, 185, 105, 102, 98);
  const crop = findReceiptPaper({ data: shadowed, width, height });
  assert.ok(crop.bottom >= 185, `expected bottom >= 185, got ${crop.bottom}`);
  assert.ok(crop.left <= 35 && crop.right >= 165 && crop.top <= 15);

  const tinySpot = new Uint8ClampedArray(width * height * 4);
  fillBox(tinySpot, 0, width, 0, height, 35, 40, 65);
  fillBox(tinySpot, 70, 100, 70, 100, 215, 215, 215);
  assert.deepEqual(findReceiptPaper({ data: tinySpot, width, height }), { left: 0, top: 0, right: width, bottom: height });

  // Dim indoor receipt (~105 grayscale) should still crop the paper instead of including textured background.
  const dim = new Uint8ClampedArray(width * height * 4);
  fillBox(dim, 0, width, 0, height, 30, 35, 50);
  fillBox(dim, 35, 165, 15, 185, 102, 100, 98);
  const dimCrop = findReceiptPaper({ data: dim, width, height });
  assert.ok(dimCrop.left <= 35 && dimCrop.right >= 165 && dimCrop.top <= 15 && dimCrop.bottom >= 185);
});

test('sauvolaThreshold separates dark text across both bright and shadowed paper halves', () => {
  const width = 60, height = 40;
  const grays = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Top half bright paper (220), bottom half shadowed paper (115).
      grays[y * width + x] = y < 20 ? 220 : 115;
    }
  }
  // Ink stroke in bright top half (145) and shadowed bottom half (55).
  grays[10 * width + 30] = 145;
  grays[30 * width + 30] = 55;
  const bin = sauvolaThreshold(grays, width, height, { radius: 8, k: 0.18 });
  assert.equal(bin[10 * width + 30], 0);
  assert.equal(bin[10 * width + 10], 255);
  assert.equal(bin[30 * width + 30], 0);
  assert.equal(bin[30 * width + 10], 255);
});

test('handles noisy $, item counts on total line, O->0 dates, spaced dots, e-wallets, and clean merchant selection', () => {
  const sgNoisy = extractReceipt('SC; CCDLEEL\nPHIẾU THANH TOÁN\nBàn $0: 10\nCa phe Sua $G 86.000\nGiờ vào: 11.02.2O16\nTổng cộng (12 món): 3 . 976.000');
  assert.equal(sgNoisy.foreign, false);
  assert.equal(sgNoisy.soTien, '3976000');
  assert.equal(sgNoisy.ngayGiaoDich, '2016-02-11');

  const sgClean = extractReceipt('SG COFFE\nGiờ vào: 11.02.2O16\nTổng cộng: 3.976.000');
  const merged = mergeReceiptReadings(sgNoisy, [sgClean]);
  assert.equal(merged.moTa, 'SG COFFE');
  assert.equal(merged.soTien, '3976000');

  assert.equal(extractReceipt('Chuyển tiền MoMo\nNgày 18/O2/2019\nSố tiền giao dịch: 54,000 đ').soTien, '54000');
  assert.equal(extractReceipt('18.02.2026\nCộng: 54,000').ngayGiaoDich, '2026-02-18');
  assert.equal(extractReceipt('Cộng: 54,000').soTien, '54000');

  // Real USD decimals or foreign currency codes must still stay blocked.
  assert.equal(extractReceipt('TOTAL $20.00\nNgày 18/02/2026').soTien, '');
  assert.equal(extractReceipt('Tổng cộng: 100 USD').soTien, '');
});
