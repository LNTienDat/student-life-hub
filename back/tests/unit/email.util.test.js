jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
const nodemailer = require('nodemailer');
const { guiEmail, guiEmailDatLaiMatKhau } = require('../../src/utils/email.util');
const env = { ...process.env };
const originalFetch = global.fetch;
beforeEach(() => { process.env = { ...env, EMAIL_PROVIDER: 'resend', EMAIL_FROM: 'test@example.com', RESEND_API_KEY: 'test-key' }; global.fetch = jest.fn(); });
afterEach(() => { process.env = { ...env }; global.fetch = originalFetch; jest.clearAllMocks(); });
test('HTTPS email sends one bounded request and returns delivery id', async () => {
 global.fetch.mockResolvedValue({ok:true,json:async()=>({id:'msg-1'})});
 await expect(guiEmail({to:'recipient@example.com',subject:'Test',html:'<p>Test</p>'})).resolves.toEqual({messageId:'msg-1'});
 const [url, options] = global.fetch.mock.calls[0];
 expect(url).toBe('https://api.resend.com/emails');
 expect(JSON.parse(options.body).to).toEqual(['recipient@example.com']);
 expect(options.signal).toBeDefined(); expect(global.fetch).toHaveBeenCalledTimes(1);
});
test.each([401,403,429,500])('HTTP %s is sanitized without retry', async status => {
 global.fetch.mockResolvedValue({ok:false,status});
 await expect(guiEmail({to:'x',subject:'x',html:'x'})).rejects.toMatchObject({code:status===429?'EMAIL_QUOTA':'EMAIL_PROVIDER',message:'Email delivery unavailable'});
 expect(global.fetch).toHaveBeenCalledTimes(1);
});
test('timeout and invalid response do not leak key/provider text', async () => {
 global.fetch.mockRejectedValue(Object.assign(new Error('secret-provider-body'),{name:'TimeoutError'}));
 await expect(guiEmail({})).rejects.toMatchObject({code:'EMAIL_TIMEOUT'});
 global.fetch.mockResolvedValue({ok:true,json:async()=>({})});
 await expect(guiEmail({})).rejects.toMatchObject({code:'EMAIL_RESPONSE'});
});
test('mock provider simulates email delivery and returns mock id without network', async () => {
  process.env.EMAIL_PROVIDER = 'mock';
  const result = await guiEmail({ to: 'student@example.com', subject: 'Deadline', html: '<p>Test</p>' });
  expect(result.messageId).toMatch(/^mock-/);
  expect(global.fetch).not.toHaveBeenCalled();
});
test('missing key and blocked Render SMTP fail before network', async () => {
 delete process.env.RESEND_API_KEY; await expect(guiEmail({})).rejects.toMatchObject({code:'EMAIL_CONFIG'});
 process.env.EMAIL_PROVIDER='smtp'; process.env.EMAIL_HOST='smtp.example.com'; process.env.RENDER='true'; process.env.EMAIL_PORT='587';
 await expect(guiEmail({})).rejects.toMatchObject({code:'EMAIL_SMTP_BLOCKED'});
 expect(global.fetch).not.toHaveBeenCalled(); expect(nodemailer.createTransport).not.toHaveBeenCalled();
});
test('SMTP bounds waiting and closes after failure', async () => {
 process.env.EMAIL_PROVIDER='smtp'; process.env.EMAIL_HOST='localhost'; delete process.env.RENDER;
 const close=jest.fn(); nodemailer.createTransport.mockReturnValue({sendMail:jest.fn().mockRejectedValue(new Error('secret')),close});
 await expect(guiEmail({})).rejects.toMatchObject({code:'EMAIL_SMTP'});
 expect(close).toHaveBeenCalledTimes(1);
 expect(nodemailer.createTransport.mock.calls[0][0].connectionTimeout).toBe(10000);
});
test('reset link and name are escaped and unsafe protocols rejected', async () => {
 global.fetch.mockResolvedValue({ok:true,json:async()=>({id:'ok'})});
 await guiEmailDatLaiMatKhau('r@example.com','<script>','https://example.com/reset?token=x&email=y');
 const html=JSON.parse(global.fetch.mock.calls[0][1].body).html;
 expect(html).toContain('&lt;script&gt;'); expect(html).toContain('&amp;email=');
 expect(html.match(/<a\s/g)).toHaveLength(1);
 expect(html.match(/https:\/\/example.com\/reset/g)).toHaveLength(1);
 await expect(guiEmailDatLaiMatKhau('r','n','javascript:alert(1)')).rejects.toMatchObject({code:'EMAIL_LINK'});
});
