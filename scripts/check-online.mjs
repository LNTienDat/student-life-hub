// Read-only deployment check. Never sends login tokens, emails, or writes.
const frontend = 'https://student-life-hub-web.onrender.com';
const backend = 'https://student-life-hub-inx4.onrender.com';
const checks = await Promise.all([
  ['frontend', frontend + '/version.json'],
  ['backend', backend + '/api/version'],
  ['databaseHealth', backend + '/api/health'],
].map(async ([name, url]) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    return { name, ok: response.ok && (name === 'databaseHealth' ? data?.status === 'ok' : data?.application === 'LifeHub' && /^[a-f0-9]{7,40}$/i.test(data?.commit || '')), status: response.status, ...(name === 'databaseHealth' ? { healthy: data?.status === 'ok' } : { commit: data?.commit || null }) };
  } catch { return { name, ok: false, status: 'unreachable' }; }
}));
const front = checks.find(x => x.name === 'frontend'), back = checks.find(x => x.name === 'backend');
const sameRelease = !!front.commit && front.commit !== 'local' && front.commit === back.commit;
console.log(JSON.stringify({ checks, sameRelease }, null, 2));
if (!checks.every(x => x.ok) || !sameRelease) process.exitCode = 1;
