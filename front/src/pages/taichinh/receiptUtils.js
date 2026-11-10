const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();

const ITEM_SUM_WARNING = 'Tạm cộng từ thành tiền từng món, chưa có dòng tổng. Hãy kiểm tra các món và phụ phí trước khi lưu.';
const AMOUNT_WARNING = 'Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.';
const FOREIGN_WARNING = 'Hóa đơn có ngoại tệ. Hãy nhập số tiền đồng cần ghi nhận.';
const DATE_WARNING = 'Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.';
const adjustments = /\b(?:vat|thue|tax|giam gia|discount|chiet khau|phi dich vu|service charge|tam tinh|subtotal)\b/;
const totalsFooter = /\b(?:ngay|tong|thanh toan|tien mat|cam on|chuc quy|date|total|cash)\b/;

// Sparse OCR can report every table cell as a separate text line. Rejoin words by vertical overlap.
export function groupReceiptWords(blocks) {
  const words = (blocks || []).flatMap(block => block.paragraphs || [])
    .flatMap(paragraph => paragraph.lines || []).flatMap(line => line.words || [])
    .filter(word => word.text?.trim() && word.bbox && word.bbox.y1 > word.bbox.y0)
    .sort((a, b) => a.bbox.y0 + a.bbox.y1 - b.bbox.y0 - b.bbox.y1);
  const rows = [];
  for (const word of words) {
    const { y0, y1 } = word.bbox;
    let row = rows.at(-1);
    const overlap = row ? Math.min(y1, row.y1) - Math.max(y0, row.y0) : 0;
    if (!row || overlap < Math.min(y1 - y0, row.y1 - row.y0) * 0.5) {
      row = { y0, y1, words: [] };
      rows.push(row);
    }
    row.words.push(word);
  }
  return rows.map(row => row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0)
    .map((word, index, line) => {
      const gap = index ? word.bbox.x0 - line[index - 1].bbox.x1 : 0;
      return (index ? (gap >= (row.y1 - row.y0) * 0.9 ? '  ' : ' ') : '') + word.text.trim();
    }).join(''));
}

export function parseDong(value) {
  let text=String(value).trim().replace(/(?:vn[dđ]|đ|₫)/gi,'').trim();
  text = text.replace(/([.,])\s+(?=\d{3}\b)/g, '$1');
  if(!/^\d[\d.,\s]*$/.test(text))return null;
  if(/(?:\d[.,]\d{3}|\d{4,})[.,]00$/.test(text))text=text.slice(0,-3);
  if(!/^\d+$/.test(text)&&!/^\d{1,3}(?:[.,\s]\d{3})+$/.test(text))return null;
  const amount=Number(text.replace(/[.,\s]/g,''));
  return Number.isSafeInteger(amount)&&amount>0?amount:null;
}

function amountTokens(line) {
  return [...line.matchAll(/(?<![\p{L}\d])\d+(?:[.,]\s*\d+|[ \u00a0\u202f]\d{3}\b)*(?![\p{L}\d])/gu)];
}

// Only sum a recognizable item table, never arbitrary numbers, dates or unit prices.
function sumReceiptItems(lines) {
  const header = lines.findIndex(line => {
    const normalized = fold(line).replace(/\s+/g, ' ');
    return /\b(?:thanh\s*tien|t[. ]+tien|line total|amount)\b/.test(normalized)
      && /\b(?:don\s*gia|unit price|so luong|sl|qty)\b/.test(normalized)
      && !/\d{1,3}[.,]\d{3}|\d{4,}/.test(line);
  });
  if(header<0)return null;
  const body = lines.slice(header + 1);
  if (body.some(line => adjustments.test(fold(line)))) return null;
  const amounts = [];
  for (const line of body) {
    if (totalsFooter.test(fold(line))) break;
    const tokens = amountTokens(line.replace(/(?<=\d)(?:vn[dđ]|[đ₫])(?!\p{L})/giu, unit => ' '.repeat(unit.length)));
    if (!tokens.length) continue;
    if (/[-−]\s*\d/.test(line)) return null;
    const [quantityToken, unitToken, totalToken] = tokens.slice(-3);
    if (!totalToken || !/^\d{1,3}$/.test(quantityToken[0])) return null;
    const unit = parseDong(unitToken[0]);
    const total = parseDong(totalToken[0]);
    if (!unit || !total || Number(quantityToken[0]) * unit !== total) return null;
    const suffix = line.slice(totalToken.index + totalToken[0].length);
    if (/[^\s|()\[\]:;!.,\-đ₫]/i.test(suffix.replace(/VN[DĐ]/gi, ''))) return null;
    amounts.push(total);
  }
  const sum=amounts.reduce((a,b)=>a+b,0);
  return amounts.length>=2&&Number.isSafeInteger(sum)?sum:null;
}
function receiptDate(lines) {
  const candidates = [];
  for (const line of lines) {
    const folded = fold(line);
    if (/\b(?:han su dung|hsd|expiry|expiration|ngay het han|han thanh toan|due date|ngay san xuat|nsx)\b/.test(folded)) continue;
    const rank = /\b(?:ngay\s+(?:giao dich|in|lap|thanh toan)|transaction date|invoice date|issued)\b/.test(folded) ? 2
      : /\b(?:ngay|date)\b/.test(folded) ? 1 : 0;
    const dateLine = folded.replace(/\b(\d{1,2})\s*(?:thg|thang|tho|th9)\.?\s*(\d{1,2})\s*[,/-]?\s*(\d{4})\b/g, '$1/$2/$3');
    for (const match of dateLine.matchAll(/(?<!\d)(\d{4})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{1,2})(?!\d)|(?<!\d)(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})(?!\d)/g)) {
      const year = match[1] || match[6];
      const month = match[2] || match[5];
      const day = match[3] || match[4];
      if (!rank && !/[/-]/.test(match[0])) continue;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) continue;
      candidates.push({ date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, rank });
    }
  }
  const rank = Math.max(-1, ...candidates.map(candidate => candidate.rank));
  const matches = [...new Set(candidates.filter(candidate => candidate.rank === rank).map(candidate => candidate.date))];
  return { date: matches.length === 1 ? matches[0] : '', rank, ambiguous: matches.length > 1 };
}

function totalLabelRank(line) {
  if (/\b(?:khach (?:dua|tra)|tien (?:thua|tra lai|khach)|cash|change|tam tinh|subtotal|giam gia|chiet khau)\b/.test(line)) return 0;
  if (/\b(?:tong thanh toan|(?:can|phai) (?:thanh toan|tra)|grand total|total due|amount due)\b/.test(line)) return 4;
  if (/\btong\s*[:：]|^tong\s*(?:\d|$|vnd\b)|\btong (?:cong|(?:thanh )?tien)\b|\bt[.\s]*cong\b|^total\b/.test(line)) return 3;
  if (/^thanh tien\b/.test(line)) return 2;
  return /^tien mat\b/.test(line) ? 1 : 0;
}

function receiptTotals(lines) {
  const candidates = [];
  const normalizedLines = lines.map(line => fold(line).replace(/^[^a-z0-9]+/, '').replace(/\s+/g, ' '));
  const hasAdjustments = normalizedLines.some(line => /\b(?:vat|thue|tax|giam gia|discount|phi dich vu)\b/.test(line));
  const hasChange = normalizedLines.some(line => /\b(?:tien thua|khach dua|tra lai|change)\b/.test(line));
  for (const [index, normalized] of normalizedLines.entries()) {
    const score = totalLabelRank(normalized);
    if (!score || (score === 2 && hasAdjustments) || (score === 1 && hasChange)) continue;
    let source = lines[index];
    if (/\bt[.\s]*cong\b/.test(normalized)) {
      source = source.replace(/(\bt[.\s]*c[oôộ]ng\s*[:：]?\s+)\d{1,3}\s+(?:\|\s*)?(?=\d{1,3}[.,]\s*\d{3}\b)/iu, '$1');
    }
    const next = lines[index + 1];
    if (!/\d/.test(source) && next && /^\s*(?:VN[DĐ]\s*)?[\d.,\s]+(?:\s*(?:VN[DĐ]|đ|₫))?\s*$/i.test(next)) source += ` ${next}`;
    if(/[-−]\s*\d|\d\s*[kKmM]\b/.test(source))continue;
    const numericSource = source.replace(/VN[DĐ]|[đ₫]/gi, ' ').replaceAll('：', ':');
    const amounts = amountTokens(numericSource).map(token => parseDong(token[0])).filter(amount => amount !== null);
    if (amounts.length === 1) candidates.push({ score, amount: amounts[0] });
  }
  return candidates;
}

export function extractReceipt(value, groupedRows = []) {
  const text = String(value || '').slice(0, 50000).replaceAll('⁄', '/');
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const candidates = [...receiptTotals(lines), ...receiptTotals(groupedRows)];
  const maximum=Math.max(0,...candidates.map(item=>item.score));
  const totals=[...new Set(candidates.filter(item=>item.score===maximum).map(item=>item.amount))];
  const moneyLines=lines.filter(line=>!/so the|\bluong\b|\bqty\b|\bquantity\b/.test(fold(line)));
  const foreign=moneyLines.some(line=>/\b(?:usd|eur|gbp|jpy|cny|thb)\b|[$€£¥]\s*\d|\d[\d., ]*\s*[$€£¥]/i.test(line));
  const rowSum = !foreign && !candidates.length ? sumReceiptItems(groupedRows) : null;
  const textSum = !foreign && !candidates.length ? sumReceiptItems(lines) : null;
  const itemSum = rowSum && textSum && rowSum !== textSum ? null : rowSum || textSum;
  const soTien=!foreign&&totals.length===1?String(totals[0]):itemSum?String(itemSum):'';
  const date = receiptDate([...lines, ...groupedRows].map(line => line.replaceAll('⁄', '/').replaceAll('／', '/')));
  const ngayGiaoDich = date.date;
  const normalized=fold(text);
  const danhMuc=/\b(?:taxi|xe buyt|xe bus|xang|gui xe|grab|be car|van chuyen)\b/.test(normalized)?'di_lai':/\b(?:com|pho|bun|banh|cafe|coffee|ca phe|nha hang|quan an|tra sua|food|restaurant|res|coca|sprite|soda)\b/.test(normalized)?'an_uong':'khac';
  const merchantLabel = /\b(?:coffee|cafe|ca phe|nha hang|restaurant|res|quan an|xang dau)\b/;
  const cleanMerchant = line => !/[@\d]{5,}|@|^[\s|]*\b(?:hoa don|phieu|bill|receipt|invoice|ngay|date|mst|ma so|tel|dt|dia chi|duong|gio|ban|thu ngan|so hd)\b/i.test(fold(line));
  const merchant = lines.find(line => merchantLabel.test(fold(line)) && cleanMerchant(line))
    || lines.slice(0, 4).find(line => /[\p{L}]{3}/u.test(line) && cleanMerchant(line));
  const warnings=[];
  if (itemSum) warnings.push(ITEM_SUM_WARNING);
  if (!soTien) warnings.push(foreign ? FOREIGN_WARNING : AMOUNT_WARNING);
  if (!ngayGiaoDich) warnings.push(DATE_WARNING);
  return {
    loai: 'chi', danhMuc, soTien, ngayGiaoDich, moTa: merchant?.slice(0, 200) || 'Hóa đơn', warnings, text,
    hasFinalTotal: maximum >= 3 && Boolean(soTien), totalRank: maximum, totalAmbiguous: maximum >= 3 && totals.length > 1,
    computedFromItems: Boolean(itemSum), itemRowsVerified: Boolean(itemSum && rowSum),
    dateRank: date.rank, dateAmbiguous: date.ambiguous, foreign,
  };
}

// Keep the strongest readings, leaving equally plausible conflicting values blank.
export function mergeReceiptReadings(primary, alternatives) {
 const readings = [primary, ...alternatives];
 const result = { ...primary };
 const finalReadings = readings.filter(item => item.hasFinalTotal || item.totalAmbiguous);
 const totalRank = Math.max(0, ...finalReadings.map(item => item.totalRank ?? 3));
 const bestTotals = finalReadings.filter(item => (item.totalRank ?? 3) === totalRank);
 const totals = bestTotals.map(item => item.soTien).filter(Boolean);
 const computed = readings.filter(item => item.computedFromItems && item.soTien);
 const sum = computed[0]?.soTien;
 const agreedSum = sum && computed.every(item => item.soTien === sum)
   && (computed.length >= 2 || computed.some(item => item.itemRowsVerified));
 const agreedTotal = totals.length && totals.every(amount => amount === totals[0]) && !bestTotals.some(item => item.totalAmbiguous)
   && (bestTotals.includes(primary) || totals.length >= 2 || (agreedSum && sum === totals[0]));
 result.foreign = readings.some(item => item.foreign);
 result.hasFinalTotal = !result.foreign && Boolean(agreedTotal);
 result.computedFromItems = !result.foreign && !finalReadings.length && Boolean(agreedSum);
 const weakAmounts = [...new Set(readings.filter(item => !item.computedFromItems && !item.hasFinalTotal && item.soTien).map(item => item.soTien))];
 result.soTien = result.hasFinalTotal ? totals[0]
   : result.computedFromItems ? sum
     : !result.foreign && !finalReadings.length && !computed.length && weakAmounts.length === 1 && weakAmounts[0] === primary.soTien ? primary.soTien : '';
 for (const key of ['danhMuc', 'moTa']) {
   if ((key === 'danhMuc' && primary[key] !== 'khac') || (key === 'moTa' && primary[key] !== 'Hóa đơn')) continue;
   const values = [...new Set(alternatives.map(item => item[key]).filter(value => value && value !== 'khac' && value !== 'Hóa đơn'))];
   if (values.length === 1) result[key] = values[0];
 }
 const dateReadings = readings.filter(item => item.ngayGiaoDich || item.dateAmbiguous);
 const dateRank = Math.max(-1, ...dateReadings.map(item => item.dateRank ?? 0));
 const bestDates = dateReadings.filter(item => (item.dateRank ?? 0) === dateRank);
 const dates = [...new Set(bestDates.map(item => item.ngayGiaoDich).filter(Boolean))];
 result.ngayGiaoDich = dates.length === 1 && !bestDates.some(item => item.dateAmbiguous) ? dates[0] : '';
 result.text = readings.map(item => item.text).join('\n\n');
 result.warnings = [];
 if (result.computedFromItems) result.warnings.push(ITEM_SUM_WARNING);
 if (!result.soTien) result.warnings.push(result.foreign ? FOREIGN_WARNING : AMOUNT_WARNING);
 if (!result.ngayGiaoDich) result.warnings.push(DATE_WARNING);
 return result;
}
