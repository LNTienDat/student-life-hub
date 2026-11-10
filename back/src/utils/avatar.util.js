const PRESETS = new Set(['cat', 'bird', 'rabbit', 'dog', 'sprout', 'rocket']);
function validAvatar(value) {
  if (value === '') return true;
  if (typeof value !== 'string' || value.length > 120000) return false;
  if (value.startsWith('preset:')) return PRESETS.has(value.slice(7));
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length < 24 || bytes.toString('base64') !== match[2]) return false;
  if (match[1] === 'jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.subarray(12, 16).toString() === 'IHDR' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(16) <= 512 && bytes.readUInt32BE(20) > 0 && bytes.readUInt32BE(20) <= 512;
  return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
}
module.exports = { validAvatar };
