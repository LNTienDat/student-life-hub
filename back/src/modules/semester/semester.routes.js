const router=require('express').Router();
const auth=require('../../middlewares/auth.middleware');
const {xemTruoc,xoaHocKy}=require('./semester.controller');
router.use(auth);router.get('/kiem-tra-xoa',xemTruoc);router.delete('/',xoaHocKy);module.exports=router;
