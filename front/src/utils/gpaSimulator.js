import {
  calcOverallGpa,
  calcSubjectAverage10,
  classifyGpa4,
  getScaleTiers,
  toGpa4,
  toLetterGrade,
} from './gradeScale.js';

export function simulateWhatIfGpa({
  subjects = [],
  overrides = {},
  hypotheticalSubjects = [],
  scaleId = '8_level',
} = {}) {
  const realOverview = calcOverallGpa(subjects, scaleId);
  const current = {
    gpa10: realOverview.gpa10,
    gpa4: realOverview.gpa4,
    gradedCredits: realOverview.gradedCredits,
    totalCredits: realOverview.totalCredits,
    classification: realOverview.hasGrades ? classifyGpa4(realOverview.gpa4) : '',
  };

  let simSum10 = 0;
  let simSum4 = 0;
  let simGradedCredits = 0;
  let simTotalCredits = 0;
  const subjectImpacts = [];

  for (const mon of subjects) {
    const credits = Number(mon?.tinChi) || 0;
    if (credits > 0) simTotalCredits += credits;

    const real = calcSubjectAverage10(mon?.diems);
    const mode = real.diem10 !== null && real.totalWeight > 0 && real.totalWeight < 100
      ? 'remaining_weight'
      : 'overall_score';
    const remainingWeight = mode === 'remaining_weight'
      ? Math.round((100 - real.totalWeight) * 100) / 100
      : 0;

    const rawOverride = overrides && Object.hasOwn(overrides, mon.id) ? overrides[mon.id] : undefined;
    const hasOverride = rawOverride !== undefined && rawOverride !== '' && rawOverride !== null && Number.isFinite(Number(rawOverride));
    const clampedOverride = hasOverride ? Math.min(10, Math.max(0, Number(rawOverride))) : null;

    let simulated10 = real.diem10;
    if (hasOverride) {
      if (mode === 'remaining_weight') {
        simulated10 = Math.round(((real.diem10 * real.totalWeight + clampedOverride * remainingWeight) / 100) * 100) / 100;
      } else {
        simulated10 = Math.round(clampedOverride * 100) / 100;
      }
    }

    const simGpa4 = simulated10 !== null ? toGpa4(simulated10, scaleId) : null;
    const simLetter = simulated10 !== null ? toLetterGrade(simulated10, scaleId) : null;
    const curGpa4 = real.diem10 !== null ? toGpa4(real.diem10, scaleId) : null;
    const curLetter = real.diem10 !== null ? toLetterGrade(real.diem10, scaleId) : null;

    if (simulated10 !== null && credits > 0) {
      simSum10 += simulated10 * credits;
      simSum4 += simGpa4 * credits;
      simGradedCredits += credits;
    }

    subjectImpacts.push({
      id: mon.id,
      ten: mon.ten,
      tinChi: credits,
      mode,
      totalWeight: real.totalWeight,
      remainingWeight,
      current10: real.diem10,
      currentGpa4: curGpa4,
      currentLetter: curLetter,
      overrideScore: clampedOverride,
      simulated10,
      simulatedGpa4: simGpa4,
      simulatedLetter: simLetter,
    });
  }

  for (const h of hypotheticalSubjects) {
    const credits = Number(h?.tinChi) || 0;
    const score = Number(h?.diem10);
    if (credits <= 0 || !Number.isFinite(score) || score < 0 || score > 10) continue;
    const rounded10 = Math.round(score * 100) / 100;
    const g4 = toGpa4(rounded10, scaleId);
    simSum10 += rounded10 * credits;
    simSum4 += g4 * credits;
    simGradedCredits += credits;
    simTotalCredits += credits;
  }

  const simulated = {
    gpa10: simGradedCredits > 0 ? Math.round((simSum10 / simGradedCredits) * 100) / 100 : null,
    gpa4: simGradedCredits > 0 ? Math.round((simSum4 / simGradedCredits) * 100) / 100 : null,
    gradedCredits: simGradedCredits,
    totalCredits: simTotalCredits,
    classification: simGradedCredits > 0 ? classifyGpa4(Math.round((simSum4 / simGradedCredits) * 100) / 100) : '',
  };

  const deltaGpa10 = current.gpa10 !== null && simulated.gpa10 !== null
    ? Math.round((simulated.gpa10 - current.gpa10) * 100) / 100
    : null;
  const deltaGpa4 = current.gpa4 !== null && simulated.gpa4 !== null
    ? Math.round((simulated.gpa4 - current.gpa4) * 100) / 100
    : null;

  return {
    current,
    simulated,
    deltaGpa10,
    deltaGpa4,
    rankChanged: Boolean(current.classification && simulated.classification && current.classification !== simulated.classification),
    subjectImpacts,
  };
}

export function solveTargetGpaPath({
  subjects = [],
  hypotheticalSubjects = [],
  targetGpa4 = 3.2,
  scaleId = '8_level',
} = {}) {
  const target = Math.min(4.0, Math.max(0, Number(targetGpa4) || 3.2));
  let fixedPoints4 = 0;
  let fixedCredits = 0;
  let remainingCredits = 0;

  for (const mon of subjects) {
    const credits = Number(mon?.tinChi) || 0;
    if (credits <= 0) continue;
    const real = calcSubjectAverage10(mon?.diems);
    if (real.diem10 !== null && real.totalWeight >= 100) {
      fixedPoints4 += toGpa4(real.diem10, scaleId) * credits;
      fixedCredits += credits;
    } else {
      remainingCredits += credits;
    }
  }

  for (const h of hypotheticalSubjects) {
    const credits = Number(h?.tinChi) || 0;
    if (credits > 0) remainingCredits += credits;
  }

  const totalCredits = fixedCredits + remainingCredits;
  if (totalCredits <= 0) {
    return {
      targetGpa4: target,
      totalCredits: 0,
      fixedCredits: 0,
      remainingCredits: 0,
      alreadyReached: false,
      achievable: false,
      requiredAvgGpa4: null,
      requiredLetter: null,
      maxPossibleGpa4: null,
    };
  }

  const maxPossibleGpa4 = Math.round(((fixedPoints4 + remainingCredits * 4.0) / totalCredits) * 100) / 100;

  if (remainingCredits === 0) {
    const fixedGpa4 = Math.round((fixedPoints4 / fixedCredits) * 100) / 100;
    const reached = fixedGpa4 >= target;
    return {
      targetGpa4: target,
      totalCredits,
      fixedCredits,
      remainingCredits: 0,
      alreadyReached: reached,
      achievable: reached,
      requiredAvgGpa4: null,
      requiredLetter: null,
      maxPossibleGpa4,
    };
  }

  const requiredRaw = (target * totalCredits - fixedPoints4) / remainingCredits;
  const alreadyReached = requiredRaw <= 0;
  const achievable = maxPossibleGpa4 + 1e-9 >= target && requiredRaw <= 4.0 + 1e-6;
  const requiredAvgGpa4 = Math.max(0, Math.min(4.0, Math.round(requiredRaw * 100) / 100));

  let requiredLetter = null;
  if (achievable) {
    const ascendingTiers = [...getScaleTiers(scaleId)].sort((a, b) => a.gpa4 - b.gpa4);
    const match = ascendingTiers.find((t) => t.gpa4 >= requiredAvgGpa4) || ascendingTiers.at(-1);
    requiredLetter = match ? match.letter : null;
  }

  return {
    targetGpa4: target,
    totalCredits,
    fixedCredits,
    remainingCredits,
    alreadyReached,
    achievable,
    requiredAvgGpa4,
    requiredLetter,
    maxPossibleGpa4,
  };
}
