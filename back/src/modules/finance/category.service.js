const { randomUUID } = require('crypto');
const prisma = require('../../prismaClient');
const { FINANCE } = require('../../constants');
const LABELS = { an_uong:'Ăn uống', di_lai:'Đi lại', khac:'Khác', hoc_phi:'Học phí', tro:'Nhà trọ', giai_tri:'Giải trí', luong:'Lương / Làm thêm', hoc_bong:'Học bổng', tro_cap:'Trợ cấp gia đình', thuong:'Thưởng' };
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const DEFAULTS = ['an_uong','di_lai','khac'].map(ma=>({ma,ten:LABELS[ma],loai:'chi',macDinh:true,daAn:false,coTheXoa:true})).concat({ma:'khac',ten:'Khác',loai:'thu',macDinh:true,daAn:false,coTheXoa:true});
const present = item => ({ma:item.ma,ten:item.ten,loai:item.loai,macDinh:DEFAULTS.some(c=>c.ma===item.ma&&c.loai===item.loai),daAn:item.daAn,coTheXoa:!item.daAn});
async function categoryLabels(idNguoiDung) {
  const custom=await prisma.danhMucTaiChinh.findMany({where:{idNguoiDung},select:{ma:true,ten:true,loai:true}});
  const labels=Object.assign(Object.create(null),LABELS);
  for(const item of custom){labels[item.loai+':'+item.ma]=item.ten;if(item.loai==='chi'||!labels[item.ma])labels[item.ma]=item.ten;}
  return labels;
}
async function validCategory(idNguoiDung,ma,loai) {
  if(typeof ma!=='string'||!ma||ma.length>80||!['thu','chi',undefined].includes(loai))return false;
  const builtins=loai==='chi'?FINANCE.DANH_MUC_CHI:loai==='thu'?FINANCE.DANH_MUC_THU:FINANCE.DANH_MUC_HOP_LE;
  if(builtins.includes(ma))return true;
  return Boolean(await prisma.danhMucTaiChinh.findFirst({where:{idNguoiDung,ma,...(loai?{loai}:{})},select:{id:true}}));
}
async function listCategories(idNguoiDung,client=prisma) {
  const [custom,used,budgets]=await Promise.all([
    client.danhMucTaiChinh.findMany({where:{idNguoiDung},orderBy:{id:'asc'}}),
    client.giaoDich.groupBy({by:['loai','danhMuc'],where:{idNguoiDung}}),
    client.nganSach.groupBy({by:['danhMuc'],where:{idNguoiDung}}),
  ]);
  const values=new Map(DEFAULTS.map(c=>[c.loai+':'+c.ma,{...c}]));
  for(const item of [...used,...budgets.map(c=>({...c,loai:'chi'}))]){
    const key=item.loai+':'+item.danhMuc;
    if(!values.has(key))values.set(key,{ma:item.danhMuc,ten:LABELS[item.danhMuc]||item.danhMuc,loai:item.loai,macDinh:false,daAn:false,coTheXoa:true});
  }
  for(const item of custom)values.set(item.loai+':'+item.ma,present(item));
  return [...values.values()];
}
const fault=(statusCode,message)=>Object.assign(new Error(message),{statusCode});
const validName=ten=>typeof ten==='string'&&!!ten.trim()&&ten.trim().length<=50&&!!normalize(ten);
async function lockOwner(tx,id){await tx.$queryRaw`SELECT id FROM "NguoiDung" WHERE id = ${id} FOR UPDATE`;}
async function currentCategory(tx,idNguoiDung,ma,loai) {
  if(typeof ma!=='string'||!ma||ma.length>80||!['chi','thu',undefined].includes(loai))throw fault(400,'Danh mục không hợp lệ.');
  let row=await tx.danhMucTaiChinh.findFirst({where:{idNguoiDung,ma,...(loai?{loai}:{})}});
  if(row)return row;
  const preset=(await listCategories(idNguoiDung,tx)).find(c=>c.ma===ma&&(!loai||c.loai===loai));
  if(!preset)throw fault(404,'Không tìm thấy danh mục của tài khoản.');
  return tx.danhMucTaiChinh.create({data:{idNguoiDung,ma,loai:preset.loai,ten:preset.ten,tenChuanHoa:normalize(preset.ten)}});
}
async function layDanhMuc(req,res){try{res.json({danhMucs:await listCategories(req.user.id)});}catch{res.status(500).json({message:'Chưa tải được danh mục.'});}}
async function themDanhMuc(req,res) {
  const {loai,ten}=req.body||{};
  if(!['thu','chi'].includes(loai)||!validName(ten))return res.status(400).json({message:'Tên danh mục cần 1–50 ký tự và loại thu/chi hợp lệ.'});
  try {
    const result=await prisma.$transaction(async tx=>{
      await lockOwner(tx,req.user.id);
      const all=await listCategories(req.user.id,tx),existing=all.find(c=>c.loai===loai&&normalize(c.ten)===normalize(ten));
      if(existing&&!existing.daAn)return existing;
      if(await tx.danhMucTaiChinh.count({where:{idNguoiDung:req.user.id,daAn:false}})>=50)throw fault(400,'Bạn đã có 50 danh mục riêng đang dùng.');
      if(existing){const current=await currentCategory(tx,req.user.id,existing.ma,loai);return tx.danhMucTaiChinh.update({where:{id:current.id},data:{daAn:false}});}
      const builtin=(loai==='chi'?FINANCE.DANH_MUC_CHI:FINANCE.DANH_MUC_THU).find(code=>normalize(LABELS[code])===normalize(ten)||normalize(code.replaceAll('_',' '))===normalize(ten));
      const occupied=builtin&&await tx.danhMucTaiChinh.findFirst({where:{idNguoiDung:req.user.id,loai,ma:builtin}});
      return tx.danhMucTaiChinh.create({data:{idNguoiDung:req.user.id,loai,ten:ten.trim().normalize('NFC'),tenChuanHoa:normalize(ten),ma:builtin&&!occupied?builtin:'custom_'+randomUUID()}});
    });
    res.status(201).json({danhMuc:present(result)});
  }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa thêm được danh mục.'});}
}
async function xoaDanhMuc(req,res) {
  try {
    const result=await prisma.$transaction(async tx=>{await lockOwner(tx,req.user.id);const current=await currentCategory(tx,req.user.id,req.params.ma,req.query.loai);return tx.danhMucTaiChinh.update({where:{id:current.id},data:{daAn:true}});});
    res.json({danhMuc:present(result),message:'Đã bỏ danh mục khỏi lựa chọn mới. Dữ liệu cũ được giữ nguyên.'});
  }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa xóa được danh mục.'});}
}
async function suaDanhMuc(req,res) {
  const {ten,loai}=req.body||{};
  if(!validName(ten))return res.status(400).json({message:'Tên danh mục cần 1–50 ký tự.'});
  try {
    const result=await prisma.$transaction(async tx=>{
      await lockOwner(tx,req.user.id);
      const current=await currentCategory(tx,req.user.id,req.params.ma,loai);
      const all=await listCategories(req.user.id,tx);
      if(all.some(c=>c.loai===current.loai&&c.ma!==current.ma&&normalize(c.ten)===normalize(ten)))throw fault(409,'Tên danh mục đã có. Hãy chọn tên khác.');
      return tx.danhMucTaiChinh.update({where:{id:current.id},data:{ten:ten.trim().normalize('NFC'),tenChuanHoa:normalize(ten)}});
    });
    res.json({danhMuc:present(result)});
  }catch(e){res.status(e.statusCode||500).json({message:e.statusCode?e.message:'Chưa đổi được tên danh mục.'});}
}
module.exports={suaDanhMuc,categoryLabels,validCategory,listCategories,layDanhMuc,themDanhMuc,xoaDanhMuc};
