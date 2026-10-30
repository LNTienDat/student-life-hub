// Isolate PDF.js/native canvas crashes from the API process, including on Windows.
const { PDFParse } = require('pdf-parse');
process.once('message', async base64 => {
  let parser, message;
  try {
    parser = new PDFParse({ data: new Uint8Array(Buffer.from(base64, 'base64')), isEvalSupported: false, useSystemFonts: false, verbosity: 0 });
    const info = await parser.getInfo();
    if (info.total > 100) throw new Error('PAGE_LIMIT');
    const result = await parser.getText();
    const pages = result.pages.map(p => ({ page: p.num, text: p.text }));
    if (pages.reduce((n,p) => n + p.text.length, 0) > 200000) throw new Error('TEXT_LIMIT');
    message = { pages };
  } catch (error) {
    message = { error: ['PAGE_LIMIT','TEXT_LIMIT'].includes(error.message) ? error.message : error.name === 'PasswordException' ? 'PASSWORD' : 'INVALID' };
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }
  process.send(message, () => process.disconnect());
});
