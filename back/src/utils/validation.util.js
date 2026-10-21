function positiveId(value) {
  return /^(?:[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
}
function validateId(req, res, next, value) {
  if (!positiveId(value)) return res.status(400).json({ message: 'ID phải là số nguyên dương hợp lệ' });
  next();
}
function validText(value, max = 100, required = true) {
  return typeof value === 'string' && (!required || value.trim().length > 0) && value.trim().length <= max;
}
module.exports = { positiveId, validateId, validText };
