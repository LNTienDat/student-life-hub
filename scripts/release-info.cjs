const { execFileSync } = require('node:child_process');
const path = require('node:path');
function releaseInfo(env = process.env) {
  let commit = env.RENDER_GIT_COMMIT || env.LIFEHUB_RELEASE || '';
  if (!/^[a-f0-9]{7,40}$/i.test(commit)) {
    try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', windowsHide: true, timeout: 2000 }).trim(); }
    catch { commit = 'local'; }
  }
  return { application: 'LifeHub', commit, environment: env.RENDER === 'true' ? 'render' : 'local' };
}
module.exports = { releaseInfo };
