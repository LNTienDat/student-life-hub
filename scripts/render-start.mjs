import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = new URL('../', import.meta.url);
const back = fileURLToPath(new URL('back/', root));
const require = createRequire(new URL('../back/package.json', import.meta.url));
const { deploymentConfig } = require('./src/deployment.js');
const env = { ...process.env, NODE_ENV: 'production', SERVE_FRONTEND: 'true' };
deploymentConfig(env);
if (!existsSync(new URL('../front/dist/index.html', import.meta.url))) throw new Error('Thiếu bản dựng frontend.');

let child;
let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  stopping = true;
  child?.kill(signal);
});
function run(args) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, args, { cwd: back, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(signal ? 1 : code ?? 1));
  });
}
const migrationCode = await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
if (migrationCode !== 0 || stopping) process.exit(migrationCode || 1);
process.exitCode = await run(['app.js']);
