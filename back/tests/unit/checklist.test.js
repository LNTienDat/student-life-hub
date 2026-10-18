const { validateChecklist } = require('../../src/modules/deadline/checklist');
test('accept valid checklist and an empty checklist', () => {
  expect(validateChecklist([])).toBeNull();
  expect(validateChecklist([{ id: 'step-1', title: 'Tìm tài liệu', done: false }])).toBeNull();
});
test('reject duplicate IDs, invalid completion types, blank titles and oversized lists', () => {
  const item = { id: 'step-1', title: 'Tìm tài liệu', done: false };
  for (const value of [[item, item], [{ ...item, done: 'false' }], [{ ...item, title: ' ' }], Array(51).fill(item), null]) expect(validateChecklist(value)).toEqual(expect.any(String));
});
