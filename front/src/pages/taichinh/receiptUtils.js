const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
export function parseDong(value) {
  let text=String(value).trim().replace(/(?:vnd|đ|₫)/gi,'').trim();
  if(!/^\d[\d.,\s]*$/.test(text))return null;
  if(/(?:\d[.,]\d{3}|\d{4,})[.,]00$/.test(text))text=text.slice(0,-3);
  if(!/^\d+$/.test(text)&&!/^\d{1,3}(?:[.,\s]\d{3})+$/.test(text))return null;
  const amount=Number(text.replace(/[.,\s]/g,''));
  return Number.isSafeInteger(amount)&&amount>0?amount:null;
}
// Only sum a recognizable item table, never arbitrary numbers, dates or unit prices.
function sumReceiptItems(lines) {
  const header=lines.findIndex(line=>/thanh tien/.test(fold(line))&&!/\d{1,3}[.,]\d{3}|\d{4,}/.test(line));
  if(header<0)return null;
  const amounts=[];
  for(const line of lines.slice(header+1)) {
    const normalized=fold(line);
    if(/ngay|tong|thanh toan|tien mat|cam on|chuc quy|vat|thue|giam gia|phi dich vu|tam tinh/.test(normalized)) {
      if(/vat|thue|giam gia|phi dich vu|tam tinh/.test(normalized))return null;
      break;
    }
    const tokens=line.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]00)?|\d+/g)||[];
    const money=tokens.map(parseDong).filter(value=>value>=1000);
    if(!money.length)continue;
    // Both unit price and line amount must be present; an incomplete row blocks summing.
    if(money.length!==2||!/[a-z]/.test(normalized))return null;
    const [unit,total]=money;
    const quantity=/\b(\d{1,3})\s+(?=\d{1,3}[.,]\d{3})/.exec(line);
    if(unit!==total&&(!quantity||Number(quantity[1])*unit!==total))return null;
    amounts.push(total);
  }
  const sum=amounts.reduce((a,b)=>a+b,0);
  return amounts.length>=2&&Number.isSafeInteger(sum)?sum:null;
}
export function extractReceipt(value) {
  const text=String(value||'').slice(0,50000).replaceAll('⁄','/');
  const lines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const candidates=[];
  const excluded=line=>/khach (?:dua|tra)|tien (?:thua|tra lai|khach)|cash|change|tam tinh|subtotal|giam gia|chiet khau/.test(fold(line));
  for(let index=0;index<lines.length;index++){
    const normalized=fold(lines[index]).replace(/^[^a-z0-9]+/, '');
    if(excluded(normalized))continue;
    const score=/tong thanh toan|(?:can|phai) thanh toan|grand total|amount due/.test(normalized)?4:/(?:^|[^a-z])tong\s*[:：]|tong cong|tong tien|\bt[.\s]*cong\b|^total\b/.test(normalized)?3:/^thanh tien\b/.test(normalized)?2:/^tien mat\b/.test(normalized)?1:0;
    if(!score)continue;
    let source=lines[index];
    if(/\bt[.\s]*cong\b/.test(normalized))source=source.replace(/(t[.\s]*cộng\s+)\d{1,3}\s+(?=\d{1,3}[.,]\d{3}\b)/iu,'$1');
    if(!/\d/.test(source)&&score>=1&&lines[index+1]&&!excluded(lines[index+1])&&!/[a-z]/i.test(fold(lines[index+1]).replace(/vnd|d/g,'')))source+=' '+lines[index+1];
    if(/[-−]\s*\d|\d\s*[kKmM]\b/.test(source))continue;
    const tokens=source.match(/\d{1,3}(?:[.,\s]\d{3})+(?:[.,]00)?|\d+(?:[.,]\d+)?/g)||[];
    const amounts=tokens.map(parseDong).filter(amount=>amount!==null);
    if(amounts.length===1)candidates.push({score,amount:amounts[0]});
  }
  const maximum=Math.max(0,...candidates.map(item=>item.score));
  const totals=[...new Set(candidates.filter(item=>item.score===maximum).map(item=>item.amount))];
  const moneyLines=lines.filter(line=>!/so the|\bluong\b|\bqty\b|\bquantity\b/.test(fold(line))).join('\n');
  const foreign=/\b(?:usd|eur|gbp|jpy|cny|thb)\b|[$€£¥]\s*\d|\d[\d., ]*\s*[$€£¥]/i.test(moneyLines);
  const itemSum=!foreign&&!candidates.length?sumReceiptItems(lines):null;
  const soTien=!foreign&&totals.length===1?String(totals[0]):itemSum?String(itemSum):'';
  const dates=[];
  for(const line of lines) {
    if(/han su dung|\bhsd\b|expiry|expiration/.test(fold(line)))continue;
    const dateLine=fold(line).replace(/(ngay\s*:\s*\d{1,2})\s+tho\s+(\d{1,2})\s*,\s*(\d{4})/g,'$1 thg $2, $3').replace(/(\d{1,2})\s*(?:thg|thang)\s*(\d{1,2})\s*[,/-]?\s*(\d{4})/g,'$1/$2/$3');
    for(const match of dateLine.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)){
      const [,day,month,year]=match;
      const date=new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));
      if(date.getUTCFullYear()===Number(year)&&date.getUTCMonth()+1===Number(month)&&date.getUTCDate()===Number(day))dates.push(year+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0'));
    }
  }
  const uniqueDates=[...new Set(dates)];
  const ngayGiaoDich=uniqueDates.length===1?uniqueDates[0]:'';
  const normalized=fold(text);
  const danhMuc=/\b(?:com|pho|bun|banh|cafe|ca phe|nha hang|quan an|tra sua|food|restaurant|res|coca|sprite|soda)\b/.test(normalized)?'an_uong':/\b(?:taxi|xe buyt|xe bus|xang|gui xe|grab|be car|van chuyen)\b/.test(normalized)?'di_lai':'khac';
  const merchant=lines.find(line=>/coffee|ca phe|nha hang|restaurant|\bres\b|\bquan an\b|xang dau/.test(fold(line))&&!/@/.test(line))||lines.find(line=>/\b(?:res|restaurant)\b/.test(fold(line))&&!/\d/.test(line))||lines.find(line=>/[\p{L}]{3}/u.test(line)&&!/^hoa don|^phieu|^bill|^receipt|^invoice|^ngay|^date|^mst|^ma so|^tel|^dt|^dia chi/i.test(fold(line))&&!/\d{5,}/.test(line));
  const warnings=[];
  if(itemSum)warnings.push('Tạm cộng từ thành tiền từng món, chưa có dòng tổng. Hãy kiểm tra các món và phụ phí trước khi lưu.');
  if(!soTien)warnings.push(foreign?'Hóa đơn có ngoại tệ. Hãy nhập số tiền đồng cần ghi nhận.':'Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.');
  if(!ngayGiaoDich)warnings.push('Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.');
  return {loai:'chi',danhMuc,soTien,ngayGiaoDich,moTa:merchant?.slice(0,200)||'Hóa đơn',warnings,text,hasFinalTotal:maximum>=3&&!!soTien,computedFromItems:!!itemSum};
}

// Prefer agreement between independent English OCR passes for weak total labels.
export function mergeReceiptReadings(primary, alternatives) {
 const result={...primary};
 const computed=[primary,...alternatives].filter(item=>item.computedFromItems).map(item=>item.soTien);
 if(!primary.hasFinalTotal&&computed.length>=2&&computed.every(value=>value===computed[0])) {
   result.soTien=computed[0];result.computedFromItems=true;
 } else if(primary.computedFromItems) { result.soTien='';result.computedFromItems=false; }
 const totals=alternatives.filter(item=>item.hasFinalTotal).map(item=>item.soTien);
 if(totals.length>=2&&totals.every(value=>value===totals[0])) {
   if(!primary.hasFinalTotal||!primary.soTien||primary.soTien===totals[0]) {
     result.soTien=totals[0];result.hasFinalTotal=true;result.computedFromItems=false;
   } else { result.soTien='';result.hasFinalTotal=false; }
 }
 for (const key of ['danhMuc', 'moTa']) {
   if ((key === 'danhMuc' && primary[key] !== 'khac') || (key === 'moTa' && primary[key] !== 'Hóa đơn')) continue;
   const values = [...new Set(alternatives.map(item => item[key]).filter(value => value && value !== 'khac' && value !== 'Hóa đơn'))];
   if (values.length === 1) result[key] = values[0];
 }
 const dates=[...new Set([primary,...alternatives].map(item=>item.ngayGiaoDich).filter(Boolean))];
 result.ngayGiaoDich=dates.length===1?dates[0]:'';
 result.text=[primary,...alternatives].map(item=>item.text).join('\n\n');
 result.warnings=[];
 if(result.computedFromItems&&result.soTien)result.warnings.push('Tạm cộng từ thành tiền từng món, chưa có dòng tổng. Hãy kiểm tra các món và phụ phí trước khi lưu.');
 if(!result.soTien)result.warnings.push('Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.');
 if(!result.ngayGiaoDich)result.warnings.push('Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.');
 return result;
}
