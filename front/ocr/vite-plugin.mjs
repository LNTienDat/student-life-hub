import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const root = dirname(require.resolve('tesseract.js/package.json'));
const core = dirname(require.resolve('tesseract.js-core/package.json'));
const files = new Map([['worker.min.js', join(root, 'dist/worker.min.js')], ['worker.LICENSE.txt', join(root, 'dist/worker.min.js.LICENSE.txt')]]);
for (const variant of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) {
  for (const ext of ['wasm.js', 'wasm']) files.set(`tesseract-core-${variant}.${ext}`, join(core, `tesseract-core-${variant}.${ext}`));
}
for (const lang of ['vie', 'eng']) files.set(`${lang}.traineddata.gz`, join(dirname(require.resolve(`@tesseract.js-data/${lang}/package.json`)), `4.0.0/${lang}.traineddata.gz`));
export default function lifeHubOcr() {
  return {
    name: 'lifehub-local-ocr',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\/ocr\/v7\//, '');
        if (!req.url?.startsWith('/ocr/v7/') || !files.has(name)) return next();
        res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
        res.end(readFileSync(files.get(name)));
      });
    },
    generateBundle() {
      for (const [name, path] of files) this.emitFile({ type: 'asset', fileName: `ocr/v7/${name}`, source: readFileSync(path) });
    },
  };
}
