
import test from 'node:test';
import assert from 'node:assert/strict';
import {readDraft,saveDraft,clearDrafts,draftKey} from '../src/services/drafts.js';
import {normalizeSemester} from '../src/utils/semester.js';
import {validDong,MAX_DONG} from '../src/utils/money.js';
import {monday,addDays} from '../src/pages/thoikhoabieu/weekUtils.js';
function storage(){const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('drafts restore for the same account/tab and never expose another account draft',()=>{const s=storage();saveDraft(s,1,'finance',{amount:'20000'});assert.deepEqual(readDraft(s,1,'finance',null),{amount:'20000'});assert.equal(readDraft(s,2,'finance',null),null);saveDraft(s,1,'finance',null);assert.equal(readDraft(s,1,'finance',null),null);});
test('corrupt/expired/unavailable drafts fall back and clearing drafts leaves authentication untouched',()=>{const s=storage();s.setItem('token','private');s.setItem(draftKey(1,'bad'),'{');assert.equal(readDraft(s,1,'bad',''), '');s.setItem(draftKey(1,'old'),JSON.stringify({version:1,userId:1,value:'old',savedAt:0}));assert.equal(readDraft(s,1,'old',()=>false),false);clearDrafts(s);assert.equal(s.getItem('token'),'private');assert.equal(s.length,1);assert.doesNotThrow(()=>saveDraft({setItem(){throw Error();}},1,'x','y'));});
test('semester normalization unifies case, unicode dashes and extra spaces without guessing unrelated names',()=>{assert.equal(normalizeSemester(' hk1  2026 – 2027 '),'HK1 2026-2027');assert.equal(normalizeSemester('HK1'),normalizeSemester('hk1'));assert.notEqual(normalizeSemester('HK1'),normalizeSemester('HK2'));});
test('all financial editors share positive integer dong bounds',()=>{for(const value of ['0','0.5','1e3','100abc',String(MAX_DONG+1),'9007199254740992'])assert.equal(validDong(value),false);for(const value of ['1','20000',String(MAX_DONG)])assert.equal(validDong(value),true);});
test('week calculations handle Vietnam Monday, Sunday and year boundaries',()=>{assert.equal(monday('2026-10-26'),'2026-10-26');assert.equal(monday('2026-11-01'),'2026-10-26');assert.equal(addDays('2026-12-28',7),'2027-01-04');});
