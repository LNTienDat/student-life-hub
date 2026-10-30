#!/usr/bin/env node
'use strict';

// Local recovery tools: no cloud connection, no DROP/--clean, no existing target overwrite.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const backupDir = path.join(root, 'improvement-backups', 'database-backups');
const fail = (code, message) => { throw Object.assign(new Error(message), { safeCode: code }); };
function configFromFile(filename) {
  let values;
  try { values = require(path.join(root, 'back/node_modules/dotenv')).parse(fs.readFileSync(filename)); }
  catch { fail('ENV_FILE', 'Không đọc được tệp cấu hình local. Cần cài thư viện backend trước.'); }
  let url;
  try { url = new URL(values.DATABASE_URL); }
  catch { fail('DATABASE_URL', 'Cấu hình CSDL không hợp lệ.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    fail('LOCAL_ONLY', 'Công cụ này chỉ dùng CSDL trên máy, không kết nối Neon hoặc máy chủ online.');
  const port = Number(url.port || 5432);
  let database, user, password;
  try { database = decodeURIComponent(url.pathname.slice(1)); user = decodeURIComponent(url.username); password = decodeURIComponent(url.password); }
  catch { fail('DATABASE_URL', 'Cấu hình CSDL không hợp lệ.'); }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(database) || !user || !Number.isInteger(port) || port < 1 || port > 65535)
    fail('DATABASE_URL', 'Tên CSDL, tài khoản hoặc cổng local không hợp lệ.');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PG/i.test(key)));
  return { database, env: { ...env, PGHOST: url.hostname === '[::1]' ? '::1' : '127.0.0.1', PGPORT: String(port),
    PGUSER: user, PGPASSWORD: password, PGDATABASE: database, PGSSLMODE: 'disable', PGCONNECT_TIMEOUT: '5', PGAPPNAME: 'LifeHub local recovery' } };
}
function binary(name) {
  const suffix = process.platform === 'win32' ? '.exe' : '';
  if (process.env.PG_BIN_DIR) {
    const explicit = path.join(process.env.PG_BIN_DIR, name + suffix);
    if (!fs.existsSync(explicit)) fail('POSTGRES_TOOLS', 'Không thấy công cụ PostgreSQL trong PG_BIN_DIR.');
    return explicit;
  }
  const probe = spawnSync(name + suffix, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  if (!probe.error && probe.status === 0) return name + suffix;
  if (process.platform === 'win32') {
    const base = path.join(process.env.ProgramFiles || 'C:/Program Files', 'PostgreSQL');
    const versions = fs.existsSync(base) ? fs.readdirSync(base).filter(v => /^\d+$/.test(v)).sort((a,b) => Number(b)-Number(a)) : [];
    for (const version of versions) {
      const candidate = path.join(base, version, 'bin', name + suffix);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  fail('POSTGRES_TOOLS', 'Chưa tìm thấy công cụ PostgreSQL. Cài PostgreSQL hoặc đặt PG_BIN_DIR tới thư mục bin.');
}
function run(name, args, config) {
  const r = spawnSync(binary(name), args, { env: config.env, encoding: 'utf8', windowsHide: true, timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
  // Native errors may contain connection details. Do not echo stderr, URL, password or child arguments.
  if (r.error || r.status !== 0) fail('POSTGRES_COMMAND', 'Thao tác PostgreSQL chưa thành công. Kiểm tra dịch vụ local, quyền truy cập và phiên bản công cụ.');
  return (r.stdout || '').trim();
}
function sql(config, query, database = config.database) {
  return run('psql', ['--no-psqlrc', '--no-password', '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1', '--dbname', database, '--command', query], config);
}
function digest(filename) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filename, 'r');
  try {
    const buffer = Buffer.alloc(1024 * 1024); let n;
    while ((n = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0,n));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
function verifyBackup(filename) {
  const archive = path.resolve(filename);
  let metadata, stat;
  try { stat = fs.statSync(archive); metadata = JSON.parse(fs.readFileSync(archive + '.json', 'utf8')); }
  catch { fail('BACKUP_FILES', 'Cần có đủ tệp .dump và tệp .dump.json đi kèm.'); }
  if (!stat.isFile() || stat.size === 0 || metadata.format !== 'lifehub-local-backup-v1' ||
      metadata.bytes !== stat.size || !/^[a-f0-9]{64}$/.test(metadata.sha256 || '') || digest(archive) !== metadata.sha256)
    fail('BACKUP_INTEGRITY', 'Bản sao lưu bị thay đổi hoặc chưa đầy đủ; chưa tạo CSDL khôi phục.');
  return { archive, metadata };
}
function backup(config) {
  const tables = sql(config, "SELECT to_regclass('public.\"NguoiDung\"') IS NOT NULL AND to_regclass('public._prisma_migrations') IS NOT NULL;");
  if (tables !== 't') fail('NOT_LIFEHUB', 'Không nhận ra cấu trúc CSDL LifeHub; chưa tạo bản sao lưu.');
  fs.mkdirSync(backupDir, { recursive: true });
  const filename = path.join(backupDir, 'lifehub-' + new Date().toISOString().replace(/[:.]/g,'-') + '-' + crypto.randomUUID().slice(0,8) + '.dump');
  const temporary = filename + '.partial';
  try {
    run('pg_dump', ['--no-password', '--format=custom', '--no-owner', '--no-privileges', '--file', temporary], config);
    run('pg_restore', ['--list', temporary], config);
    fs.chmodSync(temporary, 0o600);
    const metadata = { format: 'lifehub-local-backup-v1', createdAt: new Date().toISOString(), bytes: fs.statSync(temporary).size,
      sha256: digest(temporary), clientVersion: run('pg_dump', ['--version'], config) };
    fs.writeFileSync(filename + '.json', JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, filename);
    return { ok: true, action: 'backup', file: filename, manifest: filename + '.json', bytes: metadata.bytes,
      message: 'Đã sao lưu. Đây là dữ liệu riêng tư; giữ cả hai tệp ở nơi riêng trước khi chuyển máy.' };
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function restoreTest(config, filename, target) {
  if (!/^[a-z][a-z0-9_]{0,46}_restore_test$/.test(target) || target === config.database)
    fail('RESTORE_TARGET', 'Tên CSDL thử phải kết thúc bằng _restore_test và khác CSDL nguồn.');
  const { archive } = verifyBackup(filename);
  run('pg_restore', ['--list', archive], config);
  if (sql(config, "SELECT count(*) FROM pg_database WHERE datname='" + target + "';", 'postgres') !== '0')
    fail('TARGET_EXISTS', 'CSDL đích đã tồn tại. Hãy chọn tên thử mới; công cụ không ghi đè hoặc xóa CSDL.');
  run('createdb', ['--no-password', '--maintenance-db=postgres', '--template=template0', '--encoding=UTF8', target], config);
  try {
    run('pg_restore', ['--no-password', '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', '--dbname', target, archive], config);
  } catch (error) {
    fail('RESTORE_FAILED', 'Khôi phục chưa thành công. CSDL nguồn giữ nguyên; CSDL thử đã tạo được giữ lại để kiểm tra.');
  }
  return { ok: true, action: 'restore-test', database: target,
    message: 'Đã khôi phục sang CSDL thử riêng. CSDL đang dùng và cấu hình web giữ nguyên. Cần kiểm tra dữ liệu trước khi chuyển sang sử dụng.' };
}
function main(args) {
  const action = args.shift();
  if (!action || action === 'help' || action === '--help') {
    console.log('Sao lưu local: node scripts/database-tools.cjs backup\nKiểm tra tệp: node scripts/database-tools.cjs verify --file <ban-sao.dump>\nKhôi phục thử riêng: node scripts/database-tools.cjs restore-test --file <ban-sao.dump> --database <ten_restore_test>\nTùy chọn: --env <tep-cau-hinh-local>. Không nhận mật khẩu hay URL trên dòng lệnh.');
    return;
  }
  if (!['backup','verify','restore-test'].includes(action)) fail('ARGUMENTS', 'Thao tác không hợp lệ. Dùng help để xem hướng dẫn.');
  const options = {};
  for (let i=0;i<args.length;i+=2) {
    const key=args[i], value=args[i+1];
    if (!['--env','--file','--database'].includes(key) || !value || value.startsWith('--') || options[key]) fail('ARGUMENTS', 'Tham số chưa đúng. Dùng help để xem hướng dẫn.');
    options[key]=value;
  }
  if (action !== 'backup' && !options['--file']) fail('ARGUMENTS', 'Cần chọn tệp sao lưu bằng --file.');
  if (action === 'restore-test' && !options['--database']) fail('ARGUMENTS', 'Cần đặt tên CSDL thử bằng --database.');
  let result;
  if (action === 'verify') {
    const { metadata } = verifyBackup(options['--file']);
    result = { ok: true, action, bytes: metadata.bytes, createdAt: metadata.createdAt, message: 'Tệp khớp dấu kiểm tra. Việc này chưa xác nhận đã khôi phục được dữ liệu.' };
  } else {
    const config = configFromFile(path.resolve(root, options['--env'] || 'back/.env'));
    result = action === 'backup' ? backup(config) : restoreTest(config, options['--file'], options['--database']);
  }
  console.log(JSON.stringify(result, null, 2));
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(JSON.stringify({ ok:false, code:error.safeCode || 'LOCAL_TOOL_ERROR', message:error.safeCode ? error.message : 'Chưa hoàn tất thao tác local; không hiển thị chi tiết cấu hình riêng tư.' })); process.exitCode=1; }
}
module.exports = { configFromFile, verifyBackup, backup, restoreTest };
