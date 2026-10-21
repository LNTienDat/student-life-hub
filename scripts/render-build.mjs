import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
function npm(directory, args, extraEnv = {}) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd: fileURLToPath(new URL(directory, root)),
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
npm('front/', ['ci', '--include=dev']);
npm('front/', ['run', 'build'], { VITE_API_URL: '/api' });
npm('back/', ['ci', '--omit=dev']);
npm('back/', ['exec', '--', 'prisma', 'generate']);
