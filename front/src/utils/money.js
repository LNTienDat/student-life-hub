export const MAX_DONG = 1_000_000_000_000;
export function validDong(value) { return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value)>0 && Number(value)<=MAX_DONG; }
export const moneyError = 'Nhập số tiền nguyên từ 1 đến 1 000 000 000 000 đồng.';
