function validateChecklist(value) {
  if (!Array.isArray(value) || value.length > 50) return 'Checklist chỉ nhận tối đa 50 bước.';
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item.id !== 'string' || !/^[\w-]{1,64}$/.test(item.id)
      || ids.has(item.id) || typeof item.title !== 'string' || !item.title.trim()
      || item.title.length > 200 || typeof item.done !== 'boolean') return 'Mỗi bước cần mã riêng, tên tối đa 200 ký tự và trạng thái hợp lệ.';
    ids.add(item.id);
  }
  return null;
}
module.exports = { validateChecklist };
