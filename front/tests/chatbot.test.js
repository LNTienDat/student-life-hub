import test from 'node:test';
import assert from 'node:assert/strict';
import { chatbotHistory } from '../src/services/chatbotHistory.js';
test('history excludes welcome, current data and failed or canceled AI requests', () => {
  const messages = [{ vaiTro: 'bot', noiDung: 'welcome' }, { vaiTro: 'user', noiDung: 'GPA?', cheDo: 'du_lieu' }, { vaiTro: 'bot', noiDung: '8.00', nguon: 'du_lieu' }, { vaiTro: 'user', noiDung: 'Plan', cheDo: 'ai' }, { vaiTro: 'bot', noiDung: 'Advice', nguon: 'ai' }, { vaiTro: 'user', noiDung: 'Canceled', cheDo: 'ai' }];
  assert.deepEqual(chatbotHistory(messages), [{ vaiTro: 'user', noiDung: 'Plan' }, { vaiTro: 'bot', noiDung: 'Advice' }]);
});
test('history keeps complete recent exchanges within backend limits', () => {
  const messages = Array.from({ length: 20 }, () => [{ vaiTro: 'user', noiDung: 'q'.repeat(2000), cheDo: 'ai' }, { vaiTro: 'bot', noiDung: 'a'.repeat(5000), nguon: 'ai' }]).flat();
  const result = chatbotHistory(messages);
  assert.equal(result.length, 4);
  assert.equal(result.reduce((n, t) => n + t.noiDung.length, 0), 8000);
});
test('unified conversation sends only prior AI exchanges, never retrieved private documents',()=>{
 const messages=[{vaiTro:'user',cheDo:'auto',noiDung:'Explain document'},{vaiTro:'bot',nguon:'tai_lieu',noiDung:'Private document'},
 {vaiTro:'user',cheDo:'auto',noiDung:'Plan'},{vaiTro:'bot',nguon:'ai',noiDung:'Advice'}];
 assert.deepEqual(chatbotHistory(messages),[{vaiTro:'user',noiDung:'Plan'},{vaiTro:'bot',noiDung:'Advice'}]);
});
