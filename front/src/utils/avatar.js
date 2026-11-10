export const MAX_AVATAR_FILE = 5 * 1024 * 1024;
export function validateAvatarFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > MAX_AVATAR_FILE) throw new Error('Ảnh tối đa 5 MB.');
}
export async function prepareAvatar(file) {
  validateAvatarFile(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Ảnh quá lớn hoặc không đọc được.');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    const result = canvas.toDataURL('image/jpeg', 0.85);
    if (result.length > 120000) throw new Error('Chưa thu nhỏ được ảnh. Hãy chọn ảnh khác.');
    return result;
  } finally { URL.revokeObjectURL(url); }
}
