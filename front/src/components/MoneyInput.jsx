import { useRef, useState } from 'react';
import { formatMoneyInput, moneyDigits, moneyCaret } from '../utils/moneyInput';

export default function MoneyInput({ value, onValueChange, name, ...props }) {
  const [internal, setInternal] = useState('');
  const inputRef = useRef(null);
  const raw = String(value ?? internal);
  const formatted = formatMoneyInput(raw);
  function change(event) {
    const input = event.target;
    const next = moneyDigits(input.value);
    const digitsBefore = input.value.slice(0, input.selectionStart).replace(/[^0-9]/g, '').length;
    if (next === null) {
      input.value = formatted;
      return;
    }
    setInternal(next);
    onValueChange?.(next);
    const position = moneyCaret(formatMoneyInput(next), digitsBefore);
    requestAnimationFrame(() => {
      if (document.activeElement === inputRef.current) inputRef.current.setSelectionRange(position, position);
    });
  }
  function keyDown(event) {
    const input = event.currentTarget;
    const start = input.selectionStart;
    if (start !== input.selectionEnd) return;
    // Include the separator with the adjacent digit so deletion always edits a digit.
    if (event.key === 'Backspace' && input.value[start - 1] === ' ') input.setSelectionRange(start - 2, start);
    if (event.key === 'Delete' && input.value[start] === ' ') input.setSelectionRange(start, start + 2);
  }
  return <>
    <input {...props} ref={inputRef} type="text" inputMode="numeric" autoComplete="off" pattern="[0-9 ]*[1-9][0-9 ]*" title="Nhập số tiền nguyên lớn hơn 0 đồng" value={formatted} onChange={change} onKeyDown={keyDown} />
    {name && <input type="hidden" name={name} value={raw} disabled={props.disabled} />}
  </>;
}
