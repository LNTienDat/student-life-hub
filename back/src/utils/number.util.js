// Reject partial numbers, booleans, arrays and empty strings instead of
// silently truncating them with parseFloat/parseInt.
function finiteNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return NaN;
  if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return NaN;
  const result = Number(value);
  return Number.isFinite(result) ? result : NaN;
}

module.exports = { finiteNumber };
