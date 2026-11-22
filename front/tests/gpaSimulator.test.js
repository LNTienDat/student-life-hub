import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateWhatIfGpa, solveTargetGpaPath } from '../src/utils/gpaSimulator.js';

test('simulateWhatIfGpa simulates remaining weight, full override, hypothetical courses, rank change, and grading scales', () => {
  const subjects = [
    {
      id: 1,
      ten: 'Toán rời rạc',
      tinChi: 3,
      diems: [{ loaiDanhGia: 'Giữa kỳ', diem: 7.0, trongSo: 40 }],
    },
    {
      id: 2,
      ten: 'Cấu trúc dữ liệu',
      tinChi: 3,
      diems: [{ loaiDanhGia: 'Tổng kết', diem: 7.5, trongSo: 100 }], // 3.0 (B)
    },
  ];

  // Simulate scoring 9.5 on remaining 60% final of Toán rời rạc -> 7.0*0.4 + 9.5*0.6 = 8.5 -> 4.0 (8_level) / 3.7 (9_level)
  const sim8 = simulateWhatIfGpa({
    subjects,
    overrides: { 1: 9.5 },
    scaleId: '8_level',
  });

  assert.equal(sim8.current.gpa4, 3.0);
  assert.equal(sim8.current.classification, 'Khá');
  assert.equal(sim8.subjectImpacts[0].mode, 'remaining_weight');
  assert.equal(sim8.subjectImpacts[0].remainingWeight, 60);
  assert.equal(sim8.subjectImpacts[0].simulated10, 8.5);
  assert.equal(sim8.subjectImpacts[0].simulatedGpa4, 4.0);
  assert.equal(sim8.simulated.gpa4, 3.5);
  assert.equal(sim8.deltaGpa4, 0.5);
  assert.equal(sim8.simulated.classification, 'Giỏi');
  assert.equal(sim8.rankChanged, true);

  // Under 9_level scale, 8.5 earns 3.7 instead of 4.0 -> simulated GPA4 = (3.7 + 3.0) / 2 = 3.35
  const sim9 = simulateWhatIfGpa({
    subjects,
    overrides: { 1: 9.5 },
    scaleId: '9_level',
  });
  assert.equal(sim9.subjectImpacts[0].simulatedGpa4, 3.7);
  assert.equal(sim9.simulated.gpa4, 3.35);

  // Adding a hypothetical 4-credit course with score 9.0 (4.0) + overriding subject 2 to 8.5 (4.0)
  const withHypothetical = simulateWhatIfGpa({
    subjects,
    overrides: { 1: 9.5, 2: 8.5 },
    hypotheticalSubjects: [{ id: 'h1', ten: 'Đồ án', tinChi: 4, diem10: 9.0 }],
    scaleId: '8_level',
  });
  assert.equal(withHypothetical.simulated.totalCredits, 10);
  assert.equal(withHypothetical.simulated.gpa4, 4.0);
  assert.equal(withHypothetical.simulated.classification, 'Xuất sắc');
});

test('solveTargetGpaPath calculates achievable, reached, and unreachable target paths accurately', () => {
  const subjects = [
    {
      id: 1,
      ten: 'Môn 1',
      tinChi: 3,
      diems: [{ loaiDanhGia: 'Tổng kết', diem: 7.0, trongSo: 100 }], // fixed 3.0 * 3 = 9.0 pts
    },
    {
      id: 2,
      ten: 'Môn 2',
      tinChi: 3,
      diems: [{ loaiDanhGia: 'Giữa kỳ', diem: 8.0, trongSo: 30 }], // open 3 credits
    },
  ];

  // Achievable goal: 3.5 over 6 credits needs 21 pts total; 9 fixed -> 12 pts over 3 open credits -> needs 4.0 (A)
  const achievable = solveTargetGpaPath({ subjects, targetGpa4: 3.5, scaleId: '8_level' });
  assert.equal(achievable.fixedCredits, 3);
  assert.equal(achievable.remainingCredits, 3);
  assert.equal(achievable.achievable, true);
  assert.equal(achievable.alreadyReached, false);
  assert.equal(achievable.requiredAvgGpa4, 4.0);
  assert.equal(achievable.requiredLetter, 'A');

  // Unreachable goal: 3.6 over 6 credits needs 21.6 pts; max with 3*4.0 is (9 + 12)/6 = 3.5
  const unreachable = solveTargetGpaPath({ subjects, targetGpa4: 3.6, scaleId: '8_level' });
  assert.equal(unreachable.achievable, false);
  assert.equal(unreachable.maxPossibleGpa4, 3.5);

  // Already reached when fixed credits alone cover target or target = 1.0
  const reached = solveTargetGpaPath({
    subjects: [{ id: 1, ten: 'Môn 1', tinChi: 4, diems: [{ diem: 9.0, trongSo: 100 }] }],
    targetGpa4: 3.2,
    scaleId: '8_level',
  });
  assert.equal(reached.remainingCredits, 0);
  assert.equal(reached.alreadyReached, true);
  assert.equal(reached.achievable, true);
});
