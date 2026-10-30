export function vietnamDate(value=new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
}
export function addDays(value,count){const date=new Date(value+'T12:00:00+07:00');return vietnamDate(new Date(date.getTime()+count*86400000));}
export function monday(value=vietnamDate()){const day=new Date(value+'T12:00:00+07:00').getUTCDay();return addDays(value,-((day+6)%7));}
