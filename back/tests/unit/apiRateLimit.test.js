const express = require('express');
const request = require('supertest');
const { createApiLimiter, createHealthLimiter } = require('../../src/middlewares/apiRateLimit');
const { gioiHanDangNhap } = require('../../src/middlewares/rateLimit.middleware');
const { RATE_LIMIT } = require('../../src/constants');

function fixture() {
 const app = express();
 app.use('/api', createApiLimiter({ environment:'production', limit:2, windowMs:60000 }));
 app.get('/api/health', createHealthLimiter({limit:2,windowMs:60000}), (req,res)=>res.json({status:'ok'}));
 app.get('/api/data',(req,res)=>res.json({ok:true}));
 app.post('/api/health',(req,res)=>res.json({ok:true}));
 app.options('/api/data',(req,res)=>res.sendStatus(204));
 return app;
}
test('global policy accommodates multi-request screens and development without disabling limits',()=>{
 expect(RATE_LIMIT.GLOBAL_MAX).toBe(1200);
 expect(RATE_LIMIT.DEV_GLOBAL_MAX).toBe(3000);
 expect(RATE_LIMIT.GLOBAL_WINDOW_MS).toBe(15*60*1000);
 expect(RATE_LIMIT.AUTH_MAX).toBe(10);
 expect(RATE_LIMIT.CHATBOT_MAX).toBe(20);
});
test('general API still returns 429 with a useful Retry-After and matching JSON',async()=>{
 const app=fixture();
 expect((await request(app).get('/api/data')).status).toBe(200);
 expect((await request(app).get('/api/data')).status).toBe(200);
 const r=await request(app).get('/api/data');
 expect(r.status).toBe(429);expect(r.body.code).toBe('RATE_LIMITED');
 expect(r.body.retryAfterSeconds).toBe(Number(r.headers['retry-after']));
 expect(r.body.retryAfterSeconds).toBeGreaterThan(0);expect(r.body.message).toContain('thử lại');
});
test('health has an independent quota and does not exhaust application requests',async()=>{
 const app=fixture();
 for(let i=0;i<2;i++)expect((await request(app).get('/api/health')).status).toBe(200);
 expect((await request(app).get('/api/health')).status).toBe(429);
 for(let i=0;i<2;i++)expect((await request(app).get('/api/data')).status).toBe(200);
 expect((await request(app).get('/api/data')).status).toBe(429);
});
test('a full general quota cannot prevent a healthy server being probed',async()=>{
 const app=fixture();
 for(let i=0;i<3;i++)await request(app).get('/api/data');
 expect((await request(app).get('/api/health')).body.status).toBe('ok');
 expect((await request(app).head('/api/health')).status).toBe(200);
});
test('only GET/HEAD health checks are exempt; POST does not bypass the API quota',async()=>{
 const app=fixture();
 for(let i=0;i<2;i++)expect((await request(app).post('/api/health')).status).toBe(200);
 expect((await request(app).post('/api/health')).status).toBe(429);
});
test('preflight requests do not consume the business request quota',async()=>{
 const app=fixture();
 for(let i=0;i<3;i++)expect((await request(app).options('/api/data')).status).toBe(204);
 expect((await request(app).get('/api/data')).status).toBe(200);
});
test('failed login attempts retain the stricter existing protection',async()=>{
 const app=express();app.post('/login',gioiHanDangNhap,(req,res)=>res.sendStatus(400));
 for(let i=0;i<RATE_LIMIT.AUTH_MAX;i++)expect((await request(app).post('/login')).status).toBe(400);
 expect((await request(app).post('/login')).status).toBe(429);
});
