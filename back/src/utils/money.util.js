const { finiteNumber } = require('./number.util');
const MAX_DONG = 1_000_000_000_000;
function validDong(value) {
  const amount = finiteNumber(value);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_DONG;
}
module.exports = { validDong, MAX_DONG };
