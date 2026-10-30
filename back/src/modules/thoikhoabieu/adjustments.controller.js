const prisma=require('../../prismaClient');
const {serializable,httpError}=require('../../utils/transaction.util');
const {validDate,weekday,assertNoDatedConflicts}=require('./adjustments.service');
async function datDieuChinh(req,res){
  const id=Number(req.params.id),{ngayGoc,loai,ngayMoi,gioBatDau,gioKetThuc,phongHoc,giangVien}=req.body||{};
  if(!validDate(ngayGoc)||!['nghi','doi'].includes(loai))return res.status(400).json({message:'Chọn ngày gốc và kiểu nghỉ/đổi lịch hợp lệ.'});
  const time=/^([01]\d|2[0-3]):[0-5]\d$/;
  if(loai==='doi'&&(!validDate(ngayMoi)||!time.test(gioBatDau)||!time.test(gioKetThuc)||gioKetThuc<=gioBatDau))return res.status(400).json({message:'Ngày đổi và giờ bắt đầu/kết thúc không hợp lệ.'});
  if((phongHoc!=null&&(typeof phongHoc!=='string'||phongHoc.length>50))||(giangVien!=null&&(typeof giangVien!=='string'||giangVien.length>100)))return res.status(400).json({message:'Phòng tối đa 50 ký tự; giảng viên tối đa 100 ký tự.'});
  try {
    const change=await serializable(prisma,async tx=>{
      const base=await tx.thoiKhoaBieu.findFirst({where:{id,idNguoiDung:req.user.id}});
      if(!base)throw httpError(404,'Không tìm thấy lịch học của tài khoản.');
      if(weekday(ngayGoc)!==base.thu)throw httpError(400,'Ngày gốc phải đúng thứ của lịch lặp.');
      const data={loai,ngayMoi:loai==='doi'?ngayMoi:null,gioBatDau:loai==='doi'?gioBatDau:null,gioKetThuc:loai==='doi'?gioKetThuc:null,phongHoc:loai==='doi'?(phongHoc??base.phongHoc):null,giangVien:loai==='doi'?(giangVien??base.giangVien):null};
      const result=await tx.dieuChinhLich.upsert({where:{idBuoiHoc_ngayGoc:{idBuoiHoc:id,ngayGoc}},create:{idNguoiDung:req.user.id,idBuoiHoc:id,ngayGoc,...data},update:data});
      await assertNoDatedConflicts(tx,req.user.id,[id]);
      return result;
    });
    res.json({dieuChinh:change});
  }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa điều chỉnh được lịch.'});}
}
async function xoaDieuChinh(req,res){
  try {
    await serializable(prisma,async tx=>{
      const row=await tx.dieuChinhLich.findFirst({where:{id:Number(req.params.idDieuChinh),idNguoiDung:req.user.id}});
      if(!row)throw httpError(404,'Không tìm thấy điều chỉnh của tài khoản.');
      await tx.dieuChinhLich.delete({where:{id:row.id}});
      await assertNoDatedConflicts(tx,req.user.id,[row.idBuoiHoc]);
    });
    res.json({message:'Đã khôi phục lịch lặp cho ngày này.'});
  }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa hoàn tác được lịch.'});}
}
module.exports={datDieuChinh,xoaDieuChinh};
