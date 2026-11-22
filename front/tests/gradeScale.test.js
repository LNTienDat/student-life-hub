import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcSubjectAverage10,
  toGpa4,
  toLetterGrade,
  convertInputTo10,
  classifyGpa4,
  calcOverallGpa,
} from '../src/utils/gradeScale.js';

test('toGpa4 and toLetterGrade respect 8-level and 9-level university grading scales', () => {
  assert.equal(toGpa4(8.2, '8_level'), 3.5);
  assert.equal(toLetterGrade(8.2, '8_level'), 'B+');
  assert.equal(toGpa4(6.6, '8_level'), 2.5);
  assert.equal(toLetterGrade(6.6, '8_level'), 'C+');
  assert.equal(toGpa4(8.7, '9_level'), 3.7);
  assert.equal(toLetterGrade(9.1, '9_level'), 'A+');
  assert.equal(toGpa4(8.2, '5_level'), 3.0);
});

test('convertInputTo10 handles scale 10, scale 4, and letter grades consistently', () => {
  assert.equal(convertInputTo10('8.5', '10', '8_level'), 8.5);
  assert.equal(convertInputTo10('3.5', '4', '8_level'), 8);
  assert.equal(convertInputTo10('B+', 'letter', '8_level'), 8);
  assert.equal(convertInputTo10('A+', 'letter', '9_level'), 9);
  assert.equal(Number.isNaN(convertInputTo10('4.5', '4', '8_level')), true);
});

test('calcOverallGpa summarizes credits, GPA 10/4, passed, and risk subjects accurately', () => {
  const subjects = [
    { ten: 'Toán', tinChi: 3, diems: [{ diem: 8.5, trongSo: 100 }] },
    { ten: 'Lý', tinChi: 2, diems: [{ diem: 4.5, trongSo: 100 }] },
    { ten: 'Anh', tinChi: 2, diems: [] },
  ];
  const res = calcOverallGpa(subjects, '8_level');
  assert.equal(res.hasGrades, true);
  assert.equal(res.gradedCredits, 5);
  assert.equal(res.totalCredits, 7);
  assert.equal(res.gpa10, 6.9);
  // (4.0 * 3 + 1.0 * 2) / 5 = 14 / 5 = 2.8
  assert.equal(res.gpa4, 2.8);
  assert.equal(res.passedCount, 2);
  assert.equal(res.riskCount, 1);
  assert.equal(classifyGpa4(3.25), 'Giỏi');
  assert.equal(calcSubjectAverage10(subjects[0].diems).totalWeight, 100);
});
