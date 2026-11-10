import english from './en.json' with { type: 'json' };

let language = 'vi';
try { if (typeof localStorage !== 'undefined' && localStorage.getItem('slh:language') === 'en') language = 'en'; } catch { /* Storage can be unavailable in private browsing. */ }
const listeners = new Set();
const patterns = Object.entries(english).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => {
  const parts = key.split(/(\{\d+\})/g), indices = [];
  const expression = parts.map(part => {
    if (/^\{\d+\}$/.test(part)) { indices.push(part.slice(1, -1)); return '(.+?)'; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return { expression: new RegExp('^' + expression + '$', 'u'), value, indices };
});
export const getLanguage = () => language;
export const getLocale = () => language === 'en' ? 'en-GB' : 'vi-VN';
export const subscribeLanguage = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export function setLanguage(value) {
  if (!['vi', 'en'].includes(value) || language === value) return;
  language = value;
  try { localStorage.setItem('slh:language', value); } catch { /* The current session still changes language. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = value;
  listeners.forEach(listener => listener());
}
// Only interface copy is passed here. User names, course titles and chat answers stay untouched.
export function t(source, ...values) {
  if (typeof source !== 'string') return source;
  const key = source.trim();
  let translated = language === 'en' && english[key] ? source.replace(key, () => english[key]) : source;
  if (language === 'en' && !english[key] && !values.length) {
    const match = patterns.find(pattern => pattern.expression.test(key));
    if (match) {
      const captures = match.expression.exec(key);
      const result = match.value.replace(/\{(\d+)\}/g, (whole, index) => captures[match.indices.indexOf(index) + 1] ?? whole);
      translated = source.replace(key, () => result);
    }
  }
  return translated.replace(/\{(\d+)\}/g, (match, index) => values[index] === undefined ? match : String(values[index]));
}
if (typeof document !== 'undefined') document.documentElement.lang = language;
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === 'slh:language') setLanguage(event.newValue === 'en' ? 'en' : 'vi');
});
