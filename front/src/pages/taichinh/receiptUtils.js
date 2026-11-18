const fold = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

const ITEM_SUM_WARNING = 'Tạm cộng từ thành tiền từng món, chưa có dòng tổng. Hãy kiểm tra các món và phụ phí trước khi lưu.';
const AMOUNT_WARNING = 'Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.';
const FOREIGN_WARNING = 'Hóa đơn có ngoại tệ. Hãy nhập số tiền đồng cần ghi nhận.';
const DATE_WARNING = 'Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.';
const adjustments = /\b(?:vat|thue|tax|giam gia|discount|chiet khau|phi dich vu|service charge|tam tinh|subtotal)\b/;
const totalsFooter = /\b(?:ngay|tong|thanh toan|tien mat|cam on|chuc quy|date|total|cash)\b/;
const merchantLabel = /\b(?:coffe|coffee|cafe|ca phe|nha hang|restaurant|res|quan an|xang dau|tra sua|highlands|phuc long|katinat|circle k|gs25|winmart|lotteria|kfc|jollibee)\b/;
const badMerchantLine = /[@\d]{5,}|@|[;=~_$€£¥]|\d{1,3}[.,]\d{3}\b|^[\s|]*\b(?:hoa don|phieu|bill|receipt|invoice|ngay|date|mst|ma so|tel|dt|dia chi|duong|gio|ban|thu ngan|so hd)\b/i;

// Sparse OCR can report every table cell as a separate text line. Rejoin words by vertical overlap.
export function groupReceiptWords(blocks) {
  const words = (blocks || []).flatMap((block) => block.paragraphs || [])
    .flatMap((paragraph) => paragraph.lines || []).flatMap((line) => line.words || [])
    .filter((word) => word.text?.trim() && word.bbox && word.bbox.y1 > word.bbox.y0)
    .sort((a, b) => a.bbox.y0 + a.bbox.y1 - b.bbox.y0 - b.bbox.y1);
  const rows = [];
  for (const word of words) {
    const { x0, x1, y0, y1 } = word.bbox;
    const cy = (y0 + y1) / 2, h = y1 - y0;
    const row = rows.findLast((candidate) => {
      const rowCy = (candidate.y0 + candidate.y1) / 2, rowH = candidate.y1 - candidate.y0;
      const overlapY = Math.min(y1, candidate.y1) - Math.max(y0, candidate.y0);
      const sameBand = overlapY >= Math.min(h, rowH) * 0.45 || Math.abs(cy - rowCy) <= Math.max(h, rowH) * 0.8;
      const clashX = candidate.words.some((w) => Math.min(x1, w.bbox.x1) - Math.max(x0, w.bbox.x0) > Math.min(x1 - x0, w.bbox.x1 - w.bbox.x0) * 0.5);
      return sameBand && !clashX;
    });
    if (!row) {
      rows.push({ y0, y1, words: [word] });
    } else {
      row.words.push(word);
      row.y0 = Math.min(row.y0, y0);
      row.y1 = Math.max(row.y1, y1);
    }
  }
  return rows.map((row) => row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0)
    .map((word, index, line) => {
      const gap = index ? word.bbox.x0 - line[index - 1].bbox.x1 : 0;
      return (index ? (gap >= (row.y1 - row.y0) * 0.9 ? '  ' : ' ') : '') + word.text.trim();
    }).join(''));
}

function normalizeMoneyNoise(value) {
  return String(value)
    // Repair spaces around decimal/thousand dots & commas (e.g. "3 . 976.000", "54, 000").
    .replace(/(\d)\s+([.,])\s*(?=[OQo\d]{3}\b)/g, '$1$2')
    .replace(/([.,])\s+(?=[OQo\d]{3}\b)/g, '$1')
    // Repair O/Q/o inside digit-led grouped amounts (54,00O, 54-O00) or 4+ char integers (5O00).
    .replace(/(?<![\p{L}\d])\d[\dOQo]*(?:[.,-][\dOQo]{3})+(?![\p{L}\d])|(?<![\p{L}\d])\d[\dOQo]{3,}(?![\p{L}\d])/gu, (token) => {
      const digits = (token.match(/\d/g) || []).length;
      return digits >= 2 || /[.,-]/.test(token) ? token.replace(/[OQo]/g, '0') : token;
    })
    // Turn internal hyphenated thousand separators (54-000, 1-620-000) into dots while preserving leading minus signs.
    .replace(/(?<![\d-])([1-9]\d{0,2}(?:[.,-]\d{3})+)(?![\d-])/g, (group) => group.replaceAll('-', '.'));
}

export function parseDong(value) {
  let text = normalizeMoneyNoise(String(value).trim().replace(/(?:vn[dđ]|đ|₫)/gi, '').trim());
  text = text.replace(/(\d)\s+([.,])\s*(?=\d{3}\b)/g, '$1$2').replace(/([.,])\s+(?=\d{3}\b)/g, '$1');
  if (!/^\d[\d.,\s]*$/.test(text)) return null;
  if (/(?:\d[.,]\d{3}|\d{4,})[.,]00$/.test(text)) text = text.slice(0, -3);
  if (!/^\d+$/.test(text) && !/^\d{1,3}(?:[.,\s]\d{3})+$/.test(text)) return null;
  const amount = Number(text.replace(/[.,\s]/g, ''));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function amountTokens(line) {
  return [...line.matchAll(/(?<![\p{L}\d])\d+(?:[.,]\s*\d+|[ \u00a0\u202f]\d{3}\b)*(?![\p{L}\d])/gu)];
}

// Only sum a recognizable item table, never arbitrary numbers, dates or unit prices.
function sumReceiptItems(lines) {
  const header = lines.findIndex((line) => {
    const normalized = fold(line).replace(/\s+/g, ' ');
    return /\b(?:thanh\s*tien|t[. ]+tien|line total|amount)\b/.test(normalized)
      && /\b(?:don\s*gia|unit price|so luong|sl|qty)\b/.test(normalized)
      && !/\d{1,3}[.,]\d{3}|\d{4,}/.test(line);
  });
  if (header < 0) return null;
  const body = lines.slice(header + 1);
  if (body.some((line) => adjustments.test(fold(line)))) return null;
  const amounts = [];
  for (const line of body) {
    if (totalsFooter.test(fold(line))) break;
    const tokens = amountTokens(line.replace(/(?<=\d)(?:vn[dđ]|[đ₫])(?!\p{L})/giu, (unit) => ' '.repeat(unit.length)));
    if (!tokens.length) continue;
    if (/[-−]\s*\d/.test(line)) return null;
    const [quantityToken, unitToken, totalToken] = tokens.slice(-3);
    if (!totalToken || !/^\d{1,3}$/.test(quantityToken[0])) return null;
    const unit = parseDong(unitToken[0]);
    const total = parseDong(totalToken[0]);
    if (!unit || !total || Number(quantityToken[0]) * unit !== total) return null;
    const suffix = line.slice(totalToken.index + totalToken[0].length);
    if (/[^\s|()[\]:;!.,\-đ₫]/i.test(suffix.replace(/VN[DĐ]/gi, ''))) return null;
    amounts.push(total);
  }
  const sum = amounts.reduce((a, b) => a + b, 0);
  return amounts.length >= 2 && Number.isSafeInteger(sum) ? sum : null;
}

function repairDateNoise(line) {
  return line.replace(/(?<![\p{L}\d])([0-3OolI][0-9Oo]\s*[/.,-]\s*[01OolI][0-9Oo]\s*[/.,-]\s*(?:[12][0-9Oo]{3}|[1-3][0-9Oo]))(?![\p{L}\d])/gu,
    (token) => token.replace(/[Oo]/g, '0').replace(/[lI]/g, '1'));
}

function receiptDate(lines) {
  const candidates = [];
  for (const rawLine of lines) {
    const folded = fold(repairDateNoise(rawLine));
    if (/\b(?:han su dung|hsd|expiry|expiration|ngay het han|han thanh toan|due date|ngay san xuat|nsx)\b/.test(folded)) continue;
    const rank = /\b(?:ng[ao0]y\s+(?:giao dich|gd|in|lap|thanh toan|tao)|transaction date|invoice date|issued)\b/.test(folded) ? 2
      : /\b(?:ng[ao0]y|date|g[il1][o0]\s*(?:vao|ra)|[il1]n\s*luc|tao\s*luc|thoi gian|time|check[- ]?(?:in|out))\b|(?:^|[\s|])(?:vao|ra)\s*[:：]/.test(folded) ? 1 : 0;
    const dateLine = folded.replace(/\b(\d{1,2})\s*(?:thg|thang|tho|th9)\.?\s*(\d{1,2})\s*[,/-]?\s*(\d{4})\b/g, '$1/$2/$3');
    const dateRegex = rank >= 1
      ? /(?<!\d)(\d{4})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{1,2})(?!\d)|(?<!\d)(\d{1,2})\s*[/.,-]\s*(\d{1,2})\s*[/.,-]\s*(\d{4}|\d{2})(?!\d)/g
      : /(?<!\d)(\d{4})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{1,2})(?!\d)|(?<!\d)(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4}|\d{2})(?!\d)/g;
    for (const match of dateLine.matchAll(dateRegex)) {
      let year = match[1] || match[6];
      const month = match[2] || match[5];
      const day = match[3] || match[4];
      if (year.length === 2) {
        if (!rank || !/[./-]/.test(match[0]) || Number(year) < 15 || Number(year) > 35) continue;
        year = `20${year}`;
      }
      const yearNum = Number(year);
      if (!rank && !/[/-]/.test(match[0]) && (year.length !== 4 || yearNum < 2010 || yearNum > 2035)) continue;
      const date = new Date(Date.UTC(yearNum, Number(month) - 1, Number(day)));
      if (date.getUTCFullYear() !== yearNum || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) continue;
      candidates.push({ date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, rank });
    }
  }
  const rank = Math.max(-1, ...candidates.map((candidate) => candidate.rank));
  const matches = [...new Set(candidates.filter((candidate) => candidate.rank === rank).map((candidate) => candidate.date))];
  return { date: matches.length === 1 ? matches[0] : '', rank, ambiguous: matches.length > 1 };
}

function totalLabelRank(line) {
  if (/\b(?:khach (?:dua|tra)|tien (?:thua|tra lai|khach)|cash|change|tam tinh|subtotal|giam gia|chiet khau|hinh thuc|phuong thuc|han thanh toan|so tien giam|so tien con lai|so tien tiet kiem)\b/.test(line)) return 0;
  if (/\b(?:t[o06]n[gq]\s+(?:thanh\s*t[o0]an|t\.\s*toan|c[o06]n[gq]\s+thanh\s*t[o0]an|tien thanh toan)|(?:can|phai)\s+(?:thanh\s*t[o0]an|tra)|thuc thu|tien phai tra|grand total|total due|amount due)\b|^thanh\s*t[o0]an(?:\s*[:：]|\s+(?:vnd\b|\d))|\bt\.\s*t[o0]an(?:\s*[:：]|\s+(?:vnd\b|\d))/.test(line)) return 4;
  if (/\bt[o06]n[gq]\s*[:：]|^t[o06]n[gq]\s*(?:\d|$|vnd\b)|\bt[o06]n[gq]\s+(?:c[o06]n[gq]|(?:thanh\s+|so\s+)?tien|hoa don|tien hang)\b|\bcong tien hang\b|\bt[.\s]*c[o06]n[gq]\b|^c[o06]n[gq]\s*[:：]|^c[o06]n[gq]\s+(?:\d|vnd\b)|^so tien(?:\s+(?:giao dich|thanh toan|chuyen))?(?:\s*[:：]|\s*$|\s+\d|\s+vnd\b)|^total\b/.test(line)) return 3;
  if (/^thanh tien\b/.test(line)) return 2;
  return /^tien mat\b/.test(line) ? 1 : 0;
}

function receiptTotals(lines) {
  const candidates = [];
  const normalizedLines = lines.map((line) => fold(line).replace(/^[^a-z0-9]+/, '').replace(/\s+/g, ' '));
  const hasAdjustments = normalizedLines.some((line) => /\b(?:vat|thue|tax|giam gia|discount|phi dich vu)\b/.test(line));
  const hasChange = normalizedLines.some((line) => /\b(?:tien thua|khach dua|tra lai|change)\b/.test(line));
  for (const [index, normalized] of normalizedLines.entries()) {
    const score = totalLabelRank(normalized);
    if (!score || (score === 2 && hasAdjustments) || (score === 1 && hasChange)) continue;
    let source = lines[index];
    if (/\bt[.\s]*c[o06]n[gq]\b/.test(normalized)) {
      source = source.replace(/(\bt[.\s]*c[oôộ06]n[gq]\s*[:：]?\s+)\d{1,3}\s+(?:\|\s*)?(?=\d{1,3}[.,-]\s*[\dOQo]{3}\b)/iu, '$1');
    }
    const standaloneAmount = (line) => Boolean(line && /^\s*(?:VN[DĐ]\s*)?[\d.,\s]+(?:\s*(?:VN[DĐ]|đ|₫))?\s*$/i.test(normalizeMoneyNoise(line)));
    const next = lines[index + 1], prev = index > 0 && !totalLabelRank(normalizedLines[index - 1]) ? lines[index - 1] : '';
    if (!/\d/.test(source) && standaloneAmount(next)) source += ` ${normalizeMoneyNoise(next)}`;
    else if (!/\d/.test(source) && standaloneAmount(prev)) source += ` ${normalizeMoneyNoise(prev)}`;
    source = normalizeMoneyNoise(source);
    if (/(?:^|[\s:：])[-−]\s*\d|\d\s*[kKmM](?![\p{L}\d])/u.test(source)) continue;
    const numericSource = source.replace(/VN[DĐ]|[đ₫]/gi, ' ').replaceAll('：', ':');
    const amounts = amountTokens(numericSource).map((token) => parseDong(token[0])).filter((amount) => amount !== null);
    if (amounts.length === 1) {
      candidates.push({ score, amount: amounts[0] });
    } else if (amounts.length > 1) {
      // Ignore small non-money counts like "12 món", "10%", "#1" on the same total line.
      const large = amounts.filter((amount) => amount >= 500);
      const small = amounts.filter((amount) => amount < 500);
      if (large.length === 1 && small.every((amount) => amount < 200)) {
        candidates.push({ score, amount: large[0] });
      }
    }
  }
  return candidates;
}

function hasForeignCurrencySymbol(lines, text) {
  const moneyLines = lines.filter((line) => !/so the|\bluong\b|\bqty\b|\bquantity\b/.test(fold(line)));
  const explicitForeign = moneyLines.some((line) => /\b(?:usd|eur|gbp|jpy|cny|thb)\b/i.test(line));
  if (explicitForeign) return { foreign: true, explicitForeign: true };

  const vietContext = /\b(?:thanh toan|tong cong|phieu thanh toan|hoa don|tien mat|gio vao|gio ra|ban so|vnd|thuc thu|giam gia)\b/i.test(fold(text));
  const foreign = moneyLines.some((line) => {
    if (/\bvn[dđ]\b|[₫]|\d\s*đ\b/i.test(line)) return false;
    if (/(?:[€£¥]\s*\d|\d[\d., ]*\s*[€£¥])/.test(line)) return true;
    const hasDollarAmount = /(?:[$]\s*\d|\d[\d., ]*\s*[$])/.test(line);
    if (!hasDollarAmount) return false;
    // Decimal cents like $20.00 or absence of strong Vietnamese receipt context indicate real USD prices.
    if (/[$]\s*\d+[.,]\d{1,2}\b(?!\d)/.test(line)) return true;
    return !vietContext;
  });
  return { foreign, explicitForeign: false };
}

function merchantScore(moTa) {
  if (!moTa || moTa === 'Hóa đơn') return 0;
  if (badMerchantLine.test(fold(moTa))) return 0;
  return merchantLabel.test(fold(moTa)) ? 3 : /[\p{L}]{3}/u.test(moTa) ? 1 : 0;
}

export function extractReceipt(value, groupedRows = []) {
  const text = String(value || '').slice(0, 50000).replaceAll('⁄', '/');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const candidates = [...receiptTotals(lines), ...receiptTotals(groupedRows)];
  const maximum = Math.max(0, ...candidates.map((item) => item.score));
  const totals = [...new Set(candidates.filter((item) => item.score === maximum).map((item) => item.amount))];
  const { foreign, explicitForeign } = hasForeignCurrencySymbol(lines, text);
  const rowSum = !foreign && !candidates.length ? sumReceiptItems(groupedRows) : null;
  const textSum = !foreign && !candidates.length ? sumReceiptItems(lines) : null;
  const itemSum = rowSum && textSum && rowSum !== textSum ? null : rowSum || textSum;
  const soTien = !foreign && totals.length === 1 ? String(totals[0]) : itemSum ? String(itemSum) : '';
  const date = receiptDate([...lines, ...groupedRows].map((line) => line.replaceAll('⁄', '/').replaceAll('／', '/')));
  const ngayGiaoDich = date.date;
  const normalized = fold(text);
  const danhMuc = /\b(?:taxi|xe buyt|xe bus|xang|gui xe|grab|be car|be bike|xanh sm|van chuyen|ve xe)\b/.test(normalized)
    ? 'di_lai'
    : /\b(?:com|pho|bun|mi|hu tieu|banh|cafe|coffe|coffee|ca phe|nha hang|quan an|tra sua|tra chanh|tra gung|nuoc cam|nuoc chanh|ruou|heineken|bia|food|restaurant|res|coca|sprite|soda|pepsi|highlands|phuc long|katinat|lotteria|kfc|jollibee|circle k|gs25|winmart|familymart|bach hoa xanh)\b/.test(normalized)
      ? 'an_uong'
      : 'khac';
  const cleanMerchant = (line) => !badMerchantLine.test(fold(line));
  const merchant = lines.slice(0, 6).find((line) => merchantLabel.test(fold(line)) && cleanMerchant(line))
    || lines.slice(0, 4).find((line) => /[\p{L}]{3}/u.test(line) && cleanMerchant(line));
  const warnings = [];
  if (itemSum) warnings.push(ITEM_SUM_WARNING);
  if (!soTien) warnings.push(foreign ? FOREIGN_WARNING : AMOUNT_WARNING);
  if (!ngayGiaoDich) warnings.push(DATE_WARNING);
  return {
    loai: 'chi',
    danhMuc,
    soTien,
    ngayGiaoDich,
    moTa: merchant?.slice(0, 200) || 'Hóa đơn',
    warnings,
    text,
    hasFinalTotal: maximum >= 3 && Boolean(soTien),
    totalRank: maximum,
    totalAmbiguous: maximum >= 3 && totals.length > 1,
    computedFromItems: Boolean(itemSum),
    itemRowsVerified: Boolean(itemSum && rowSum),
    dateRank: date.rank,
    dateAmbiguous: date.ambiguous,
    foreign,
    explicitForeign,
  };
}

// Keep the strongest readings, leaving equally plausible conflicting values blank.
export function mergeReceiptReadings(primary, alternatives) {
  const readings = [primary, ...alternatives];
  const result = { ...primary };
  const finalReadings = readings.filter((item) => item.hasFinalTotal || item.totalAmbiguous);
  const totalRank = Math.max(0, ...finalReadings.map((item) => item.totalRank ?? 3));
  const bestTotals = finalReadings.filter((item) => (item.totalRank ?? 3) === totalRank);
  const totals = bestTotals.map((item) => item.soTien).filter(Boolean);
  const computed = readings.filter((item) => item.computedFromItems && item.soTien);
  const sum = computed[0]?.soTien;
  const agreedSum = sum && computed.every((item) => item.soTien === sum)
    && (computed.length >= 2 || computed.some((item) => item.itemRowsVerified));
  const singleFinal = totals.length === 1 && !bestTotals.some((item) => item.totalAmbiguous)
    && (!primary.soTien || primary.soTien === totals[0])
    && !computed.some((item) => item.soTien !== totals[0])
    && !readings.some((item) => item.hasFinalTotal && item.soTien && item.soTien !== totals[0]);
  const agreedTotal = totals.length && totals.every((amount) => amount === totals[0]) && !bestTotals.some((item) => item.totalAmbiguous)
    && (bestTotals.includes(primary) || totals.length >= 2 || (agreedSum && sum === totals[0]) || singleFinal);
  const anyExplicitForeign = readings.some((item) => item.explicitForeign);
  const foreignCount = readings.filter((item) => item.foreign).length;
  result.foreign = anyExplicitForeign || (agreedTotal && totals.length >= 2 && foreignCount === 1 ? false : foreignCount > 0);
  result.hasFinalTotal = !result.foreign && Boolean(agreedTotal);
  result.computedFromItems = !result.foreign && !finalReadings.length && Boolean(agreedSum);
  const weakAmounts = [...new Set(readings.filter((item) => !item.computedFromItems && !item.hasFinalTotal && item.soTien).map((item) => item.soTien))];
  result.soTien = result.hasFinalTotal ? totals[0]
    : result.computedFromItems ? sum
      : !result.foreign && !finalReadings.length && !computed.length && weakAmounts.length === 1 && weakAmounts[0] === primary.soTien ? primary.soTien : '';

  if (primary.danhMuc === 'khac') {
    const categories = [...new Set(alternatives.map((item) => item.danhMuc).filter((value) => value && value !== 'khac'))];
    if (categories.length === 1) result.danhMuc = categories[0];
  }
  const bestMerchantScore = Math.max(...readings.map((item) => merchantScore(item.moTa)));
  if (merchantScore(primary.moTa) < bestMerchantScore) {
    const cleanMerchants = [...new Set(readings.filter((item) => merchantScore(item.moTa) === bestMerchantScore).map((item) => item.moTa))];
    if (cleanMerchants.length === 1) result.moTa = cleanMerchants[0];
  }

  const dateReadings = readings.filter((item) => item.ngayGiaoDich || item.dateAmbiguous);
  const dateRank = Math.max(-1, ...dateReadings.map((item) => item.dateRank ?? 0));
  const bestDates = dateReadings.filter((item) => (item.dateRank ?? 0) === dateRank);
  const dates = [...new Set(bestDates.map((item) => item.ngayGiaoDich).filter(Boolean))];
  result.ngayGiaoDich = dates.length === 1 && !bestDates.some((item) => item.dateAmbiguous) ? dates[0] : '';
  result.text = readings.map((item) => item.text).join('\n\n');
  result.warnings = [];
  if (result.computedFromItems) result.warnings.push(ITEM_SUM_WARNING);
  if (!result.soTien) result.warnings.push(result.foreign ? FOREIGN_WARNING : AMOUNT_WARNING);
  if (!result.ngayGiaoDich) result.warnings.push(DATE_WARNING);
  return result;
}
