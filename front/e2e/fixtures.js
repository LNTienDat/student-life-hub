import { test as base, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(new URL('../../back/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const dbURL = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
if (!['localhost','127.0.0.1'].includes(dbURL.hostname) || !dbURL.pathname.endsWith('_test')) throw Error('Test DB required');
const prisma = new PrismaClient();
export const test = base.extend({
  account: async ({ request }, provide) => {
    const emails = ['e2e-' + randomUUID() + '@example.invalid'];
    const password = 'LifeHub-test-only-2026';
    const user = await prisma.nguoiDung.create({ data: { ten: 'E2E Student', email: emails[0], matKhau: await bcrypt.hash(password,10) } });
    const token = jwt.sign({id:user.id,matKhauDoiLuc:user.matKhauDoiLuc.getTime()},'lifehub-e2e-isolated-only-20261029',{expiresIn:'1h'});
    const api = async (method, path, data) => {
      const response = await request.fetch('http://127.0.0.1:5063/api'+path, { method, data, headers:{Authorization:'Bearer '+token} });
      expect(response.ok(), method+' '+path+' '+await response.text()).toBeTruthy();
      return response.json();
    };
    try { await provide({ user, token, password, api, trackEmail: email => emails.push(email) }); }
    finally {
      await prisma.nguoiDung.deleteMany({where:{email:{in:emails}}});
      await prisma.$disconnect();
    }
  },
  session: async ({ page, account }, provide) => {
    await page.addInitScript(({user,token})=>{
      localStorage.setItem('user',JSON.stringify(user));localStorage.setItem('token',token);
    },{user:account.user,token:account.token});
    await provide(page);
  },
});
export { expect };
