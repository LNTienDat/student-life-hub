import test from 'node:test';
import assert from 'node:assert/strict';
import { withOcrDeadline } from '../src/services/ocrDeadline.js';
const pending = signal => new Promise((resolve,reject) => {
 if(signal.aborted) reject(signal.reason);
 else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
});
test('stuck OCR stops with an actionable timeout', async () => {
 await assert.rejects(withOcrDeadline(pending,undefined,15),{name:'TimeoutError'});
});
test('user cancellation interrupts OCR', async () => {
 const parent=new AbortController(); const job=withOcrDeadline(pending,parent.signal);
 parent.abort(); await assert.rejects(job,{name:'AbortError'});
});
test('completed OCR returns its data', async () => {
 assert.deepEqual(await withOcrDeadline(async()=>({rows:[1]})),{rows:[1]});
});
test('previous cancellation propagates before work begins', async () => {
 const parent=new AbortController(); parent.abort();
 await assert.rejects(withOcrDeadline(pending,parent.signal),{name:'AbortError'});
});
