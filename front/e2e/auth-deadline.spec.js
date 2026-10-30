import { test, expect } from './fixtures.js';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../back/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

test('public auth theme persists and password visibility is independently controlled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  const toggle = page.getByRole('button', { name: /Chuyển sang giao diện/ });
  await toggle.click();
  const theme = await page.evaluate(() => localStorage.getItem('theme'));
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Password-only-test');
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'password');
  await page.goto('/register');
  await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
  await page.getByRole('button', { name: 'Hiện xác nhận mật khẩu', exact: true }).click();
  await expect(page.getByLabel('Xác nhận mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'password');
  await page.goto('/dat-lai-mat-khau?token=test-only&email=test%40example.invalid');
  await page.getByRole('button', { name: 'Hiện mật khẩu mới', exact: true }).click();
  await expect(page.getByLabel('Mật khẩu mới', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Xác nhận mật khẩu mới', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Hiện xác nhận mật khẩu mới', exact: true }).click();
  await expect(page.getByLabel('Xác nhận mật khẩu mới', { exact: true })).toHaveAttribute('type', 'text');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('form > div').last()).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu', exact: true }).locator('..')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '../docs/qa/auth-reset-mobile-20261030.png', fullPage: true });
});

test('completed work collapses; 24h countdown survives reload, trash restores and settings persist', async ({ session: page, account }) => {
  const prisma = new PrismaClient();
  try {
    const d = await prisma.deadline.create({ data: { idNguoiDung: account.user.id, tieuDe: 'Completed E2E', hanChot: new Date(), trangThai: 'hoan_thanh', hoanThanhLuc: new Date() } });
    await page.goto('/deadline');
    await expect(page.getByLabel('Tự xóa việc đã hoàn thành sau 24 giờ')).not.toBeChecked();
    const undo = page.getByRole('button', { name: 'Đánh dấu chưa hoàn thành: Completed E2E', exact: true });
    await expect(undo).toBeHidden();
    await page.locator('summary').filter({ hasText: 'Đã hoàn thành (1)' }).click();
    await expect(undo).toBeVisible();
    await page.getByLabel('Tự xóa việc đã hoàn thành sau 24 giờ').check();
    await expect(page.getByText(/Xóa sau 2[34]h/)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Tự xóa việc đã hoàn thành sau 24 giờ')).toBeChecked();
    await expect(undo).toBeHidden();
    await prisma.deadline.update({ where: { id: d.id }, data: { hoanThanhLuc: new Date(Date.now() - 90000000) } });
    await page.reload();
    await page.locator('summary').filter({ hasText: 'Đã xóa (1)' }).click();
    await page.getByRole('button', { name: 'Khôi phục', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đánh dấu hoàn thành: Completed E2E', exact: true })).toBeVisible();
    await expect(page.locator('summary').filter({ hasText: 'Đã xóa (0)' })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: '../docs/qa/deadline-cleanup-mobile-20261030.png', fullPage: true });
  } finally { await prisma.$disconnect(); }
});
