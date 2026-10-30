const {createHash}=require('crypto');
const prisma=require('../../prismaClient');
const {normalizeSemester}=require('../../utils/semester.util');
const {serializable,httpError}=require('../../utils/transaction.util');
function semesterName(value){if(typeof value!=='string'||!value.trim()||value.length>100)throw httpError(400,'Tên học kỳ cần 1–100 ký tự.');return normalizeSemester(value);}
async function inspect(client,userId,name){
  const [user,subjects,classes]=await Promise.all([
    client.nguoiDung.findUnique({where:{id:userId},select:{hocKyHienTai:true,hocKyDaLuu:true}}),
    client.monHoc.findMany({where:{idNguoiDung:userId},select:{id:true,hocKy:true,diems:{select:{id:true}}},orderBy:{id:'asc'}}),
    client.thoiKhoaBieu.findMany({where:{idNguoiDung:userId},select:{id:true,hocKy:true},orderBy:{id:'asc'}}),
  ]);
  const subjectRows=subjects.filter(row=>normalizeSemester(row.hocKy)===name),classRows=classes.filter(row=>normalizeSemester(row.hocKy)===name);
  const subjectIds=subjectRows.map(row=>row.id),classIds=classRows.map(row=>row.id);
  const current=normalizeSemester(user?.hocKyHienTai)===name;
  if(!current&&!(user?.hocKyDaLuu||[]).some(item=>normalizeSemester(item)===name)&&!subjectIds.length&&!classIds.length)throw httpError(404,'Học kỳ không còn tồn tại trong tài khoản.');
  const [changes,deadlines]=await Promise.all([
    client.dieuChinhLich.findMany({where:{idNguoiDung:userId,idBuoiHoc:{in:classIds}},select:{id:true},orderBy:{id:'asc'}}),
    client.deadline.findMany({where:{idNguoiDung:userId,idMonHoc:{in:subjectIds}},select:{id:true},orderBy:{id:'asc'}}),
  ]);
  const gradeIds=subjectRows.flatMap(row=>row.diems.map(d=>d.id)).sort((a,b)=>a-b);
  const snapshot=createHash('sha256').update(JSON.stringify({userId,name,subjectIds,classIds,gradeIds,changes,deadlines,current})).digest('hex');
  return {ten:name,soMon:subjectIds.length,soDiem:gradeIds.length,soBuoi:classIds.length,soDieuChinh:changes.length,soDeadlineGiuLai:deadlines.length,dangHoc:current,snapshot,subjectIds,classIds};
}
function publicPreview(value){const {subjectIds,classIds,...preview}=value;return preview;}
async function xemTruoc(req,res){try{const ten=semesterName(req.query.ten);res.json(publicPreview(await inspect(prisma,req.user.id,ten)));}catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa kiểm tra được học kỳ.'});}}
async function xoaHocKy(req,res){
 try{
  const {ten:raw,snapshot,xacNhan}=req.body||{},ten=semesterName(raw);
  if(typeof xacNhan!=='string'||normalizeSemester(xacNhan)!==ten||typeof snapshot!=='string'||! /^[a-f0-9]{64}$/.test(snapshot))throw httpError(400,'Nhập đúng tên học kỳ và kiểm tra lại phạm vi trước khi xóa.');
  const result=await serializable(prisma,async tx=>{
    await tx.$queryRaw`SELECT id FROM "NguoiDung" WHERE id = ${req.user.id} FOR UPDATE`;
    const scope=await inspect(tx,req.user.id,ten);
    if(scope.snapshot!==snapshot)throw httpError(409,'Dữ liệu học kỳ vừa thay đổi. Hãy kiểm tra lại số lượng trước khi xóa.');
    await tx.monHoc.deleteMany({where:{idNguoiDung:req.user.id,id:{in:scope.subjectIds}}});
    await tx.thoiKhoaBieu.deleteMany({where:{idNguoiDung:req.user.id,id:{in:scope.classIds}}});
    if(scope.dangHoc)await tx.nguoiDung.update({where:{id:req.user.id},data:{hocKyHienTai:''}});
    const profile=await tx.nguoiDung.findUnique({where:{id:req.user.id},select:{hocKyDaLuu:true}});
    await tx.nguoiDung.update({where:{id:req.user.id},data:{hocKyDaLuu:profile.hocKyDaLuu.filter(item=>normalizeSemester(item)!==ten)}});
    const user=await tx.nguoiDung.findUnique({where:{id:req.user.id},select:{hocKyHienTai:true,hocKyDaLuu:true}});
    return {...publicPreview(scope),hocKyHienTai:user.hocKyHienTai,hocKyDaLuu:user.hocKyDaLuu};
  });
  res.json({...result,message:'Đã xóa học kỳ. Tài chính và deadline được giữ nguyên.'});
 }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa xóa được học kỳ.'});}
}
module.exports={xemTruoc,xoaHocKy};
