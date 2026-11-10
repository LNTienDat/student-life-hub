const { extractInput } = require('../../src/modules/rag/document.service');
const request = require('supertest');
const express = require('express');

describe('RAG document input sanitization & validation', () => {
  const validText = 'Nội dung tài liệu học tập để kiểm thử tính năng RAG với độ dài hợp lệ ít nhất bốn mươi ký tự.';

  test('sanitizes document title by stripping control characters and trimming', async () => {
    const input = {
      tieuDe: '   Tài liệu học tập \u0000\u0007   ',
      noiDung: validText,
    };
    const result = await extractInput(input);
    expect(result.tieuDe).toBe('Tài liệu học tập');
  });

  test('rejects empty or whitespace-only title', async () => {
    await expect(extractInput({ tieuDe: '   \u0000  ', noiDung: validText }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('sanitizes filename and strips path traversal', async () => {
    const file = {
      ten: '../../secret/my_notes\u0000.txt',
      base64: Buffer.from(validText).toString('base64'),
    };
    const result = await extractInput({ tieuDe: 'Notes', tep: file });
    expect(result.tenTep).toBe('my_notes.txt');
  });

  test('rejects binary files disguised as .txt with PE/EXE header (MZ)', async () => {
    const exeBuffer = Buffer.concat([Buffer.from([0x4D, 0x5A]), Buffer.from(validText)]);
    const file = {
      ten: 'malicious.txt',
      base64: exeBuffer.toString('base64'),
    };
    await expect(extractInput({ tieuDe: 'Fake TXT', tep: file }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('rejects binary files disguised as .md with ZIP/Office header (PK)', async () => {
    const zipBuffer = Buffer.concat([Buffer.from([0x50, 0x4B, 0x03, 0x04]), Buffer.from(validText)]);
    const file = {
      ten: 'archive.md',
      base64: zipBuffer.toString('base64'),
    };
    await expect(extractInput({ tieuDe: 'Fake MD', tep: file }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('rejects text files containing binary null bytes', async () => {
    const nullBuffer = Buffer.concat([Buffer.from(validText), Buffer.from([0x00, 0x00])]);
    const file = {
      ten: 'nullbyte.txt',
      base64: nullBuffer.toString('base64'),
    };
    await expect(extractInput({ tieuDe: 'Null text', tep: file }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('accepts clean UTF-8 text file', async () => {
    const file = {
      ten: 'lecture-notes.txt',
      base64: Buffer.from(validText, 'utf8').toString('base64'),
    };
    const result = await extractInput({ tieuDe: 'Valid text', tep: file });
    expect(result.tenTep).toBe('lecture-notes.txt');
    expect(result.soKyTu).toBeGreaterThanOrEqual(40);
  });
});

describe('Swagger documentation protection (Basic Auth)', () => {
  let app;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('allows open access when SWAGGER_USER is not configured', async () => {
    delete process.env.SWAGGER_USER;
    delete process.env.SWAGGER_PASSWORD;
    const testApp = require('../../app');
    const res = await request(testApp).get('/api-docs/');
    expect(res.status).not.toBe(401);
  });

  test('prompts for Basic Auth when SWAGGER_USER and SWAGGER_PASSWORD are set', async () => {
    process.env.SWAGGER_USER = 'admin';
    process.env.SWAGGER_PASSWORD = 'secret_password_123';
    const testApp = require('../../app');

    const unauth = await request(testApp).get('/api-docs/');
    expect(unauth.status).toBe(401);
    expect(unauth.headers['www-authenticate']).toContain('Basic realm=');

    const wrongAuth = await request(testApp)
      .get('/api-docs/')
      .set('Authorization', 'Basic ' + Buffer.from('admin:wrong').toString('base64'));
    expect(wrongAuth.status).toBe(401);

    const validAuth = await request(testApp)
      .get('/api-docs/')
      .set('Authorization', 'Basic ' + Buffer.from('admin:secret_password_123').toString('base64'));
    expect(validAuth.status).not.toBe(401);
  });
});
