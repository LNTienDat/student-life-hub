export function moneyDigits(value) {
  const text = String(value ?? '');
  return /^[0-9\s]*$/.test(text) ? text.replace(/\s/g, '') : null;
}

export function formatMoneyInput(value) {
  return String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function moneyCaret(formatted, digitsBefore) {
  if (digitsBefore === 0) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++count === digitsBefore) return i + 1;
  }
  return formatted.length;
}
