import test from 'node:test';
import assert from 'node:assert/strict';
import { refineReceipt } from '../src/services/receiptRecovery.js';
import { extractReceipt } from '../src/pages/taichinh/receiptUtils.js';

test('secondary download failure preserves the first amount and missing-date warning',async()=>{
 const first=extractReceipt('CƠM SINH VIÊN\nTổng tiền 20000');
 const result=await refineReceipt(first,async()=>{throw Error('model unavailable');});
 assert.equal(result.soTien,'20000');assert.equal(result.ngayGiaoDich,'');
 assert(result.warnings.some(w=>w.includes('ngày')));
 assert(result.warnings.some(w=>w.includes('đối chiếu')));
 assert.equal(first.warnings.length,1);
});
test('fallback preserves foreign-currency warning and never invents a total',async()=>{
 const result=await refineReceipt(extractReceipt('TOTAL 20 USD'),async()=>{throw Error('offline');});
 assert.equal(result.soTien,'');assert(result.warnings.some(w=>w.includes('ngoại tệ')));
});
test('closing the dialog aborts rather than returning a partial successful draft',async()=>{
 const controller=new AbortController();
 await assert.rejects(refineReceipt(extractReceipt('Tổng tiền 20000'),async()=>{
  controller.abort();throw Error('worker terminated');
 },controller.signal),{name:'AbortError'});
});
test('deadline timeout is not swallowed as successful recognition',async()=>{
 await assert.rejects(refineReceipt(extractReceipt('Tổng tiền 20000'),async()=>{
  throw new DOMException('Too slow','TimeoutError');
 }),{name:'TimeoutError'});
});
test('successful matching readings still improve weak first total',async()=>{
 const primary=extractReceipt('Thành tiền 380581');
 const alternate=extractReceipt('Tổng cộng 500000\nNgày 17/04/2019');
 const result=await refineReceipt(primary,async()=>[alternate,alternate]);
 assert.equal(result.soTien,'500000');assert.equal(result.ngayGiaoDich,'2019-04-17');
});
