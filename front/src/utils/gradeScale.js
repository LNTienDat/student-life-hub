export const GRADE_SCALE_PRESETS = {
  '8_level': {
    id: '8_level',
    shortLabel: '8 bậc (A, B+, B, C+, C, D+, D, F)',
    label: 'Chuẩn 8 bậc BGD (có B+, C+, D+)',
    tiers: [
      { min10: 8.5, gpa4: 4.0, letter: 'A' },
      { min10: 8.0, gpa4: 3.5, letter: 'B+' },
      { min10: 7.0, gpa4: 3.0, letter: 'B' },
      { min10: 6.5, gpa4: 2.5, letter: 'C+' },
      { min10: 5.5, gpa4: 2.0, letter: 'C' },
      { min10: 5.0, gpa4: 1.5, letter: 'D+' },
      { min10: 4.0, gpa4: 1.0, letter: 'D' },
      { min10: 0.0, gpa4: 0.0, letter: 'F' },
    ],
  },
  '9_level': {
    id: '9_level',
    shortLabel: '9 bậc (có A+ & A)',
    label: 'Chuẩn 9 bậc (A+ = 4.0, A = 3.7)',
    tiers: [
      { min10: 9.0, gpa4: 4.0, letter: 'A+' },
      { min10: 8.5, gpa4: 3.7, letter: 'A' },
      { min10: 8.0, gpa4: 3.5, letter: 'B+' },
      { min10: 7.0, gpa4: 3.0, letter: 'B' },
      { min10: 6.5, gpa4: 2.5, letter: 'C+' },
      { min10: 5.5, gpa4: 2.0, letter: 'C' },
      { min10: 5.0, gpa4: 1.5, letter: 'D+' },
      { min10: 4.0, gpa4: 1.0, letter: 'D' },
      { min10: 0.0, gpa4: 0.0, letter: 'F' },
    ],
  },
  '5_level': {
    id: '5_level',
    shortLabel: '5 bậc cơ bản (A, B, C, D, F)',
    label: 'Chuẩn 5 bậc (A, B, C, D, F)',
    tiers: [
      { min10: 8.5, gpa4: 4.0, letter: 'A' },
      { min10: 7.0, gpa4: 3.0, letter: 'B' },
      { min10: 5.5, gpa4: 2.0, letter: 'C' },
      { min10: 4.0, gpa4: 1.0, letter: 'D' },
      { min10: 0.0, gpa4: 0.0, letter: 'F' },
    ],
  },
};

export const LETTER_GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

const PREFS_KEY = 'slh:grade-prefs';

export function loadGradePrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { scaleId: '8_level', displayMode: 'both', inputScale: '10' };
    const parsed = JSON.parse(raw);
    return {
      scaleId: GRADE_SCALE_PRESETS[parsed?.scaleId] ? parsed.scaleId : '8_level',
      displayMode: ['both', '10', '4'].includes(parsed?.displayMode) ? parsed.displayMode : 'both',
      inputScale: ['10', '4', 'letter'].includes(parsed?.inputScale) ? parsed.inputScale : '10',
    };
  } catch {
    return { scaleId: '8_level', displayMode: 'both', inputScale: '10' };
  }
}

export function saveGradePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* Optional preference */ }
}

export function getScaleTiers(scaleId = '8_level') {
  return (GRADE_SCALE_PRESETS[scaleId] || GRADE_SCALE_PRESETS['8_level']).tiers;
}

export function calcSubjectAverage10(diems) {
  if (!Array.isArray(diems) || !diems.length) return { diem10: null, totalWeight: 0 };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const d of diems) {
    const score = Number(d.diem);
    const weight = Number(d.trongSo);
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return { diem10: null, totalWeight: 0 };
  return {
    diem10: Math.round((weightedSum / totalWeight) * 100) / 100,
    totalWeight: Math.round(totalWeight * 100) / 100,
  };
}

export function toGpa4(diem10, scaleId = '8_level') {
  const num = Number(diem10);
  if (!Number.isFinite(num) || num < 0) return 0;
  const tiers = getScaleTiers(scaleId);
  const found = tiers.find((t) => num >= t.min10);
  return found ? found.gpa4 : 0;
}

export function toLetterGrade(diem10, scaleId = '8_level') {
  const num = Number(diem10);
  if (!Number.isFinite(num) || num < 0) return 'F';
  const tiers = getScaleTiers(scaleId);
  const found = tiers.find((t) => num >= t.min10);
  return found ? found.letter : 'F';
}

export function convertInputTo10(value, inputScale = '10', scaleId = '8_level') {
  if (inputScale === 'letter') {
    const upper = String(value ?? '').trim().toUpperCase();
    const tiers = getScaleTiers(scaleId);
    const found = tiers.find((t) => t.letter === upper)
      || Object.values(GRADE_SCALE_PRESETS).flatMap((p) => p.tiers).find((t) => t.letter === upper);
    return found ? found.min10 : NaN;
  }
  const num = Number(String(value ?? '').replace(',', '.').trim());
  if (!Number.isFinite(num)) return NaN;
  if (inputScale === '4') {
    if (num < 0 || num > 4) return NaN;
    if (num === 0) return 0;
    const tiers = getScaleTiers(scaleId).filter((t) => t.gpa4 > 0).sort((a, b) => a.gpa4 - b.gpa4);
    if (num >= tiers[tiers.length - 1].gpa4) return tiers[tiers.length - 1].min10;
    for (let i = 0; i < tiers.length; i++) {
      if (num <= tiers[i].gpa4) {
        if (i === 0) return Math.round(((num / tiers[0].gpa4) * tiers[0].min10) * 100) / 100;
        const prev = tiers[i - 1];
        const curr = tiers[i];
        const ratio = (num - prev.gpa4) / (curr.gpa4 - prev.gpa4);
        return Math.round((prev.min10 + ratio * (curr.min10 - prev.min10)) * 100) / 100;
      }
    }
  }
  if (num < 0 || num > 10) return NaN;
  return Math.round(num * 100) / 100;
}

export function classifyGpa4(gpa4) {
  const n = Number(gpa4);
  if (!Number.isFinite(n)) return '';
  if (n >= 3.6) return 'Xuất sắc';
  if (n >= 3.2) return 'Giỏi';
  if (n >= 2.5) return 'Khá';
  if (n >= 2.0) return 'Trung bình';
  return 'Cần cải thiện';
}

export function calcOverallGpa(monHocs = [], scaleId = '8_level') {
  let sum10 = 0;
  let sum4 = 0;
  let gradedCredits = 0;
  let totalCredits = 0;
  let passedCount = 0;
  let riskCount = 0;

  for (const mon of monHocs) {
    const credits = Number(mon?.tinChi) || 0;
    totalCredits += credits;
    const { diem10 } = calcSubjectAverage10(mon?.diems);
    if (diem10 === null || credits <= 0) continue;
    sum10 += diem10 * credits;
    sum4 += toGpa4(diem10, scaleId) * credits;
    gradedCredits += credits;
    if (diem10 >= 4.0) passedCount++;
    if (diem10 < 5.0) riskCount++;
  }

  return {
    hasGrades: gradedCredits > 0,
    gpa10: gradedCredits > 0 ? Math.round((sum10 / gradedCredits) * 100) / 100 : null,
    gpa4: gradedCredits > 0 ? Math.round((sum4 / gradedCredits) * 100) / 100 : null,
    gradedCredits,
    totalCredits,
    passedCount,
    riskCount,
  };
}
