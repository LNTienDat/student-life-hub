import test from 'node:test';
import assert from 'node:assert/strict';
import { t, setLanguage, getLanguage, getLocale, subscribeLanguage } from '../src/i18n/language.js';
import { validateAvatarFile, MAX_AVATAR_FILE } from '../src/utils/avatar.js';
test('language changes translate interface copy and placeholders, with a Vietnamese default and safe fallback', () => {
  setLanguage('vi'); assert.equal(t('Lịch học'), 'Lịch học');
  let changes=0; const stop=subscribeLanguage(()=>changes++);
  setLanguage('en'); assert.equal(getLocale(),'en-GB'); assert.equal(t('Lịch học'),'Schedule'); assert.equal(t(' Hồ sơ '),' Profile ');
  assert.equal(t('Hồ sơ của {0}','Tiến Đạt'),'Profile of Tiến Đạt');
  assert.equal(t('Còn 3 ngày'),'3 days left');
  assert.equal(t('Tên riêng không có trong từ điển'),'Tên riêng không có trong từ điển');
  setLanguage('invalid'); assert.equal(getLanguage(),'en'); assert.equal(changes,1); stop(); setLanguage('vi');
});
test('avatar uploads reject non-raster, oversized and missing files before decoding', () => {
  for(const type of ['image/jpeg','image/png','image/webp'])assert.doesNotThrow(()=>validateAvatarFile({type,size:100}));
  assert.throws(()=>validateAvatarFile({type:'image/svg+xml',size:100}));
  assert.throws(()=>validateAvatarFile({type:'image/jpeg',size:MAX_AVATAR_FILE+1}));
  assert.throws(()=>validateAvatarFile(null));
});
