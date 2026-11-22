/**
 * Quy đổi, tính toán điểm theo các quy chuẩn thang điểm đại học (10 / 4 / chữ)
 */

const GRADE_SCALE_PRESETS = {
  '8_level': {
    id: '8_level',
    label: 'Chuẩn 8 bậc (A, B+, B, C+, C, D+, D, F)',
    tiers: [
      { min10: 8.5, max10: 10.0, gpa4: 4.0, letter: 'A', mid10: 9.0 },
      { min10: 8.0, max10: 8.49, gpa4: 3.5, letter: 'B+', mid10: 8.2 },
      { min10: 7.0, max10: 7.99, gpa4: 3.0, letter: 'B', mid10: 7.4 },
      { min10: 6.5, max10: 6.99, gpa4: 2.5, letter: 'C+', mid10: 6.7 },
      { min10: 5.5, max10: 6.49, gpa4: 2.0, letter: 'C', mid10: 5.9 },
      { min10: 5.0, max10: 5.49, gpa4: 1.5, letter: 'D+', mid10: 5.2 },
      { min10: 4.0, max10: 4.99, gpa4: 1.0, letter: 'D', mid10: 4.4 },
      { min10: 0.0, max10: 3.99, gpa4: 0.0, letter: 'F', mid10: 2.0 },
    ],
  },
  '9_level': {
    id: '9_level',
    label: 'Chuẩn 9 bậc (có A+)',
    tiers: [
      { min10: 9.0, max10: 10.0, gpa4: 4.0, letter: 'A+', mid10: 9.5 },
      { min10: 8.5, max10: 8.99, gpa4: 3.7, letter: 'A', mid10: 8.7 },
      { min10: 8.0, max10: 8.49, gpa4: 3.5, letter: 'B+', mid10: 8.2 },
      { min10: 7.0, max10: 7.99, gpa4: 3.0, letter: 'B', mid10: 7.4 },
      { min10: 6.5, max10: 6.99, gpa4: 2.5, letter: 'C+', mid10: 6.7 },
      { min10: 5.5, max10: 6.49, gpa4: 2.0, letter: 'C', mid10: 5.9 },
      { min10: 5.0, max10: 5.49, gpa4: 1.5, letter: 'D+', mid10: 5.2 },
      { min10: 4.0, max10: 4.99, gpa4: 1.0, letter: 'D', mid10: 4.4 },
      { min10: 0.0, max10: 3.99, gpa4: 0.0, letter: 'F', mid10: 2.0 },
    ],
  },
  '5_level': {
    id: '5_level',
    label: 'Chuẩn 5 bậc cơ bản (A, B, C, D, F)',
    tiers: [
      { min10: 8.5, max10: 10.0, gpa4: 4.0, letter: 'A', mid10: 9.0 },
      { min10: 7.0, max10: 8.49, gpa4: 3.0, letter: 'B', mid10: 7.7 },
      { min10: 5.5, max10: 6.99, gpa4: 2.0, letter: 'C', mid10: 6.2 },
      { min10: 4.0, max10: 5.49, gpa4: 1.0, letter: 'D', mid10: 4.7 },
      { min10: 0.0, max10: 3.99, gpa4: 0.0, letter: 'F', mid10: 2.0 },
    ],
  },
};

function getScaleTiers(scaleId = '5_level') {
  return (GRADE_SCALE_PRESETS[scaleId] || GRADE_SCALE_PRESETS['5_level']).tiers;
}

/**
 * Tính điểm trung bình một môn học từ danh sách các điểm
 * @param {Array} diems - Mảng các { diem, trongSo }
 * @returns {{ diemTrungBinh: number, tongTrongSo: number }}
 */
function tinhDiemMon(diems) {
  if (!diems || diems.length === 0) return { diemTrungBinh: 0, tongTrongSo: 0 };
  const tongTrongSo = diems.reduce((sum, d) => sum + d.trongSo, 0);
  if (tongTrongSo === 0) return { diemTrungBinh: 0, tongTrongSo: 0 };
  const tongDiemCoTrongSo = diems.reduce((sum, d) => sum + d.diem * d.trongSo, 0);
  const diemTrungBinh = Math.round((tongDiemCoTrongSo / tongTrongSo) * 100) / 100;
  return { diemTrungBinh, tongTrongSo };
}

/**
 * Quy đổi điểm hệ 10 sang hệ 4 (mặc định 5 bậc để tương thích ngược, hỗ trợ truyền scaleId)
 */
function quyDoiHe4(diem10, scaleId = '5_level') {
  const num = Number(diem10);
  if (!Number.isFinite(num) || num < 0) return 0;
  const tiers = getScaleTiers(scaleId);
  const matched = tiers.find((tier) => num >= tier.min10);
  return matched ? matched.gpa4 : 0;
}

function quyDoiDiemChu(diem10, scaleId = '8_level') {
  const num = Number(diem10);
  if (!Number.isFinite(num) || num < 0) return 'F';
  const tiers = getScaleTiers(scaleId);
  const matched = tiers.find((tier) => num >= tier.min10);
  return matched ? matched.letter : 'F';
}

/**
 * Quy đổi đầu vào (thang 10, thang 4, hoặc điểm chữ) về điểm hệ 10 chuẩn (0..10)
 */
function convertInputToScale10({ value, inputScale = '10', gradeScale = '8_level' }) {
  if (inputScale === 'letter') {
    const cleanLetter = String(value || '').trim().toUpperCase();
    const tiers = getScaleTiers(gradeScale);
    const found = tiers.find((t) => t.letter === cleanLetter)
      || Object.values(GRADE_SCALE_PRESETS).flatMap((p) => p.tiers).find((t) => t.letter === cleanLetter);
    return found ? found.min10 : NaN;
  }

  const num = Number(String(value ?? '').replace(',', '.').trim());
  if (!Number.isFinite(num)) return NaN;

  if (inputScale === '4') {
    if (num < 0 || num > 4) return NaN;
    if (num === 0) return 0;
    const tiers = getScaleTiers(gradeScale).filter((t) => t.gpa4 > 0).sort((a, b) => a.gpa4 - b.gpa4);
    if (num >= tiers[tiers.length - 1].gpa4) return tiers[tiers.length - 1].min10;
    for (let i = 0; i < tiers.length; i++) {
      if (num <= tiers[i].gpa4) {
        if (i === 0) {
          return Math.round(((num / tiers[0].gpa4) * tiers[0].min10) * 100) / 100;
        }
        const prev = tiers[i - 1];
        const curr = tiers[i];
        const ratio = (num - prev.gpa4) / (curr.gpa4 - prev.gpa4);
        return Math.round((prev.min10 + ratio * (curr.min10 - prev.min10)) * 100) / 100;
      }
    }
    return Math.round((num * 2.5) * 100) / 100;
  }

  if (num < 0 || num > 10) return NaN;
  return Math.round(num * 100) / 100;
}

module.exports = {
  GRADE_SCALE_PRESETS,
  tinhDiemMon,
  quyDoiHe4,
  quyDoiDiemChu,
  convertInputToScale10,
};
