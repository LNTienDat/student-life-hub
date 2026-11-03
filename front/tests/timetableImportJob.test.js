import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimetableImportJob } from '../src/services/timetableImportJob.js';
const urls=()=>({createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}});
test('detaching a route view preserves recognition and edited draft until explicit cancellation',async()=>{
 let finish,signal;
 const job=createTimetableImportJob((file,options)=>{signal=options.signal;return new Promise(resolve=>{finish=resolve;});},urls());
 const unsubscribe=job.subscribe(()=>{});
 const pending=job.read({},'HK1');unsubscribe();
 assert.equal(signal.aborted,false);assert.equal(job.snapshot().busy,true);
 finish({rows:[{tenMon:'Python'}],text:'source'});await pending;
 assert.equal(job.snapshot().rows.length,1);assert.equal(job.snapshot().semester,'HK1');
 job.set('rows',rows=>rows.map(row=>({...row,tenMon:'Đã sửa'})));
 assert.equal(job.snapshot().rows[0].tenMon,'Đã sửa');job.dispose();
});
test('logout/disposal aborts work, releases image and ignores late results',async()=>{
 let finish,signal,released=0;
 const job=createTimetableImportJob((file,options)=>{signal=options.signal;return new Promise(resolve=>{finish=resolve;});},{createObjectURL:()=> 'blob:private',revokeObjectURL:()=>released++});
 const pending=job.read({},'HK1');job.dispose();
 assert(signal.aborted);assert.equal(released,1);
 finish({rows:[{tenMon:'Private course'}],text:'private'});await pending;
 assert.equal(job.snapshot().image,'');assert.deepEqual(job.snapshot().rows,[]);assert.equal(job.snapshot().text,'');
});
test('new image and explicit stop cannot be overwritten by an older OCR task',async()=>{
 const finishes=[];const job=createTimetableImportJob(()=>new Promise(resolve=>finishes.push(resolve)),urls());
 const first=job.read({},'HK1');const second=job.read({},'HK2');
 finishes[0]({rows:[{tenMon:'Old'}],text:'old'});await first;assert.equal(job.snapshot().busy,true);
 job.cancel();finishes[1]({rows:[{tenMon:'New'}],text:'new'});await second;
 assert.deepEqual(job.snapshot().rows,[]);assert.equal(job.snapshot().busy,false);job.dispose();
});
