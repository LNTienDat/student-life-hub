const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
export function parseDong(value) {
  let text=String(value).trim().replace(/(?:vnd|đ|₫)/gi,'').trim();
  if(!/^\d[\d.,\s]*$/.test(text))return null;
  if(/(?:\d[.,]\d{3}|\d{4,})[.,]00$/.test(text))text=text.slice(0,-3);
  if(!/^\d+$/.test(text)&&!/^\d{1,3}(?:[.,\s]\d{3})+$/.test(text))return null;
  const amount=Number(text.replace(/[.,\s]/g,''));
  return Number.isSafeInteger(amount)&&amount>0?amount:null;
}
export function extractReceipt(value) {
  const text=String(value||'').slice(0,50000).replaceAll('⁄','/');
  const lines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const candidates=[];
  const excluded=line=>/khach (?:dua|tra)|tien (?:thua|tra lai|khach)|cash|change|tam tinh|subtotal|giam gia|chiet khau/.test(fold(line));
  for(let index=0;index<lines.length;index++){
    const normalized=fold(lines[index]);
    if(excluded(normalized))continue;
    const score=/tong thanh toan|(?:can|phai) thanh toan|grand total|amount due/.test(normalized)?4:/tong cong|tong tien|\bt[.\s]*cong\b|^total\b/.test(normalized)?3:/^thanh tien\b/.test(normalized)?2:/^tien mat\b/.test(normalized)?1:0;
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
  const soTien=!foreign&&totals.length===1?String(totals[0]):'';
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
  if(!soTien)warnings.push(foreign?'Hóa đơn có ngoại tệ. Hãy nhập số tiền đồng cần ghi nhận.':'Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.');
  if(!ngayGiaoDich)warnings.push('Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.');
  return {loai:'chi',danhMuc,soTien,ngayGiaoDich,moTa:merchant?.slice(0,200)||'Hóa đơn',warnings,text,hasFinalTotal:maximum>=3&&!!soTien};
}

// Prefer agreement between independent English OCR passes for weak total labels.
export function mergeReceiptReadings(primary, alternatives) {
 const result={...primary};
 const totals=alternatives.filter(item=>item.hasFinalTotal).map(item=>item.soTien);
 if(totals.length>=2&&totals.every(value=>value===totals[0])) {
   if(!primary.hasFinalTotal||!primary.soTien||primary.soTien===totals[0]) {
     result.soTien=totals[0];result.hasFinalTotal=true;
   } else { result.soTien='';result.hasFinalTotal=false; }
 }
 const dates=[...new Set([primary,...alternatives].map(item=>item.ngayGiaoDich).filter(Boolean))];
 result.ngayGiaoDich=dates.length===1?dates[0]:'';
 result.text=[primary,...alternatives].map(item=>item.text).join('\n\n');
 result.warnings=[];
 if(!result.soTien)result.warnings.push('Chưa xác định chắc tổng tiền thanh toán. Hãy đối chiếu ảnh và nhập lại.');
 if(!result.ngayGiaoDich)result.warnings.push('Chưa xác định chắc ngày giao dịch. Hãy chọn lại ngày.');
 return result;
}
