import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export default function lifeHubPwa() {
  return {
    name: 'lifehub-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      for (const name of Object.keys(bundle).sort()) {
        const output = bundle[name];
        hash.update(name).update(output.type === 'chunk' ? output.code : output.source);
      }
      for (const file of ['manifest.webmanifest', 'offline.html', 'offline.js', 'theme-init.js', 'icons/app-192.png', 'icons/app-512.png', 'icons/app-maskable-512.png', 'icons/apple-touch-icon.png']) {
        hash.update(readFileSync(fileURLToPath(new URL(`../public/${file}`, import.meta.url))));
      }
      const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
      hash.update(template);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template.replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 20)) });
    },
  };
}
