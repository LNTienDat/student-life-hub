const {normalizeSemester}=require('../../utils/semester.util');
const {parseVietnamDate,vietnamParts}=require('../../utils/date.util');
const {httpError}=require('../../utils/transaction.util');
function dateKey(value){const p=vietnamParts(value);return p.year+'-'+String(p.month).padStart(2,'0')+'-'+String(p.day).padStart(2,'0');}
function validDate(value){return typeof value==='string'&&/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(parseVietnamDate(value).getTime());}
function plusDays(value,count){return dateKey(new Date(parseVietnamDate(value).getTime()+count*86400000));}
function weekday(value){const n=vietnamParts(parseVietnamDate(value)).weekday;return n===7?8:n+1;}
function weekStart(value=dateKey(new Date())){if(!validDate(value))throw httpError(400,'Ngày xem lịch không hợp lệ.');return plusDays(value,-(weekday(value)-2));}
function projectWeek(base,adjustments,start){
  const end=plusDays(start,6),result=[];
  const byOrigin=new Map(adjustments.map(item=>[item.idBuoiHoc+':'+item.ngayGoc,item]));
  const add=(item,origin,change)=>{
    if(change?.loai==='nghi')return;
    const day=change?.ngayMoi||origin;
    if(day<start||day>end)return;
    result.push({...item,...(change?{gioBatDau:change.gioBatDau||item.gioBatDau,gioKetThuc:change.gioKetThuc||item.gioKetThuc,phongHoc:change.phongHoc??item.phongHoc,giangVien:change.giangVien??item.giangVien}:{}),thu:weekday(day),ngayHoc:day,ngayGoc:origin,occurrenceId:item.id+':'+origin,daDieuChinh:!!change});
  };
  for(const item of base){
    const origin=plusDays(start,item.thu-2);add(item,origin,byOrigin.get(item.id+':'+origin));
    for(const change of adjustments.filter(a=>a.idBuoiHoc===item.id&&a.ngayGoc!==origin&&a.ngayMoi>=start&&a.ngayMoi<=end))add(item,change.ngayGoc,change);
  }
  return result.sort((a,b)=>a.thu-b.thu||a.gioBatDau.localeCompare(b.gioBatDau));
}
async function loadWeek(client,userId,base,date){
  const start=weekStart(date),end=plusDays(start,6);
  const changes=await client.dieuChinhLich.findMany({where:{idNguoiDung:userId,idBuoiHoc:{in:base.map(item=>item.id)},OR:[{ngayGoc:{gte:start,lte:end}},{ngayMoi:{gte:start,lte:end}}]},orderBy:{ngayGoc:'asc'}});
  return {lichLap:base,thoiKhoaBieu:projectWeek(base,changes,start),dieuChinhs:changes.map(c=>({...c,tenMon:base.find(b=>b.id===c.idBuoiHoc)?.tenMon})),tuNgay:start,denNgay:end};
}
async function assertNoDatedConflicts(client,userId,changedIds){
  const [base,changes]=await Promise.all([client.thoiKhoaBieu.findMany({where:{idNguoiDung:userId}}),client.dieuChinhLich.findMany({where:{idNguoiDung:userId}})]);
  const weeks=new Set(changes.flatMap(c=>[weekStart(c.ngayGoc),...(c.ngayMoi?[weekStart(c.ngayMoi)]:[])]));
  for(const start of weeks){
    const items=projectWeek(base,changes,start);
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const a=items[i],b=items[j];
      if(changedIds&&!changedIds.includes(a.id)&&!changedIds.includes(b.id))continue;
      if(a.ngayHoc===b.ngayHoc&&(!a.hocKy||!b.hocKy||normalizeSemester(a.hocKy)===normalizeSemester(b.hocKy))&&a.gioBatDau<b.gioKetThuc&&a.gioKetThuc>b.gioBatDau)throw httpError(409,'Lịch ngày '+a.ngayHoc+' bị trùng giờ giữa '+a.tenMon+' và '+b.tenMon+'.');
    }
  }
}
module.exports={dateKey,validDate,plusDays,weekday,weekStart,projectWeek,loadWeek,assertNoDatedConflicts};
