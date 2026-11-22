const {
  normalizeConstraints,
  computeFreeIntervalsForDay,
  solveStudySchedule,
  verifyScheduleConstraints,
} = require('../../src/modules/planner/symbolic.solver');
const {
  heuristicParseConstraints,
  parseNaturalConstraints,
} = require('../../src/modules/planner/neural.parser');

describe('Neuro-Symbolic Study Planner (Symbolic Solver & Neural Parser)', () => {
  const fixedNow = new Date('2026-11-23T01:00:00Z'); // 08:00 AM Mon 2026-11-23 Vietnam

  test('never overlaps scheduled or rescheduling classes and verifies all hard invariants', () => {
    const classes = [
      { id: 1, tenMon: 'Xử lý ảnh', thu: 2, ngayHoc: '2026-11-23', gioBatDau: '13:00', gioKetThuc: '17:00' },
      { id: 2, tenMon: 'Lập trình Python', thu: 3, ngayHoc: '2026-11-24', gioBatDau: '18:00', gioKetThuc: '21:00' },
      { id: 3, tenMon: 'Toán rời rạc', thu: 4, ngayHoc: '2026-11-25', gioBatDau: '07:00', gioKetThuc: '11:30' },
    ];
    const plan = solveStudySchedule({
      weekStartDate: '2026-11-23',
      classes,
      deadlines: [{ id: 10, tieuDe: 'Bài tập Python', hanChot: '2026-11-27T23:59:00+07:00', doUuTien: 'cao' }],
      subjects: [{ id: 5, ten: 'Lập trình Python', tinChi: 3, diems: [{ diem: 4.5, trongSo: 100 }] }],
      constraints: { sessionMinutes: 90, breakMinutes: 15, totalSessionsTarget: 8 },
      now: fixedNow,
    });

    expect(plan.verification).toMatchObject({
      valid: true,
      zeroClassOverlap: true,
      zeroSelfOverlap: true,
      withinStudyWindow: true,
      respectsAvoidedDays: true,
    });
    expect(plan.sessions.length).toBeGreaterThan(0);

    // Ensure verifyScheduleConstraints detects violations if artificially corrupted
    const corrupted = [...plan.sessions, { ...plan.sessions[0], gioBatDau: '18:30', gioKetThuc: '20:00', ngayHoc: '2026-11-24', thu: 3 }];
    expect(verifyScheduleConstraints({ sessions: corrupted, classes, constraints: plan.constraints }).zeroClassOverlap).toBe(false);
  });

  test('strictly respects avoidWeekdays, earliest/latest hour bounds, maxSessionsPerDay, and past hours', () => {
    const { freeIntervals } = computeFreeIntervalsForDay({
      date: '2026-11-23',
      classesForDay: [{ gioBatDau: '19:00', gioKetThuc: '20:30' }],
      earliestMin: 7 * 60,
      latestMin: 22 * 60,
      breakMinutes: 15,
      nowDateKey: '2026-11-23',
      nowMinutes: 18 * 60 + 20, // 18:20 Vietnam -> earliest schedulable is 18:45, blocked by 18:45-20:45 class+break -> leaves 20:45-22:00 (75 mins)
    });
    expect(freeIntervals).toEqual([{ start: 20 * 60 + 45, end: 22 * 60 }]);

    const plan = solveStudySchedule({
      weekStartDate: '2026-11-23',
      classes: [],
      deadlines: [],
      subjects: [{ id: 1, ten: 'Cơ sở dữ liệu', diems: [] }],
      constraints: {
        earliestHour: 8,
        latestHour: 20,
        avoidWeekdays: [8, 7],
        maxSessionsPerDay: 1,
        sessionMinutes: 60,
        totalSessionsTarget: 5,
      },
      now: fixedNow,
    });

    expect(plan.verification.valid).toBe(true);
    expect(plan.sessions.every((s) => s.thu !== 7 && s.thu !== 8)).toBe(true);
    expect(plan.sessions.every((s) => s.gioBatDau >= '08:00' && s.gioKetThuc <= '20:00')).toBe(true);
    const dayCounts = new Map();
    for (const s of plan.sessions) dayCounts.set(s.ngayHoc, (dayCounts.get(s.ngayHoc) || 0) + 1);
    expect([...dayCounts.values()].every((count) => count <= 1)).toBe(true);
  });

  test('prioritizes at-risk subjects (< 5.0) and places due-week deadlines before dueDateKey', () => {
    const plan = solveStudySchedule({
      weekStartDate: '2026-11-23',
      classes: [],
      deadlines: [
        { id: 1, tieuDe: 'Nộp đồ án Python', hanChot: '2026-11-25T17:00:00+07:00', doUuTien: 'cao', monHoc: { id: 11, ten: 'Lập trình Python' } },
      ],
      subjects: [
        { id: 11, ten: 'Lập trình Python', diems: [{ diem: 4.0, trongSo: 40 }] },
        { id: 12, ten: 'Kỹ năng mềm', diems: [{ diem: 9.0, trongSo: 100 }] },
      ],
      constraints: { totalSessionsTarget: 3, sessionMinutes: 90, preferredWindows: ['evening'] },
      now: fixedNow,
    });

    const dlSession = plan.sessions.find((s) => s.tieuDe.includes('Nộp đồ án Python'));
    expect(dlSession).toBeDefined();
    expect(dlSession.ngayHoc <= '2026-11-25').toBe(true);
    expect(dlSession.reasons.join(' ')).toContain('Khẩn cấp');
    expect(plan.stats.riskSubjectCount).toBe(1);
    expect(plan.sessions[0].priorityScore).toBeGreaterThanOrEqual(plan.sessions.at(-1).priorityScore);
  });

  test('parses Vietnamese constraints deterministically and falls back gracefully on Gemini failure', async () => {
    const parsed = heuristicParseConstraints(
      'Ưu tiên ôn Lập trình Python buổi tối trước 22h, mỗi buổi 90 phút, nghỉ Chủ nhật và học 5 buổi',
      ['Lập trình Python', 'Giải tích 1']
    );
    expect(normalizeConstraints(parsed)).toMatchObject({
      preferredWindows: ['evening'],
      latestHour: 22,
      sessionMinutes: 90,
      avoidWeekdays: [8],
      totalSessionsTarget: 5,
      focusTopics: ['Lập trình Python'],
    });

    // Mock successful Neural Gemini call
    const okRes = await parseNaturalConstraints(
      { prompt: 'Ôn chiều mỗi buổi 60 phút', subjectNames: ['Python'], useAI: true, dongYGuiAI: true },
      {
        getAiConfig: () => ({ sanSang: true, model: 'gemini-3.5-flash-lite', key: 'x'.repeat(30) }),
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    earliestHour: 7,
                    latestHour: 21,
                    preferredWindows: ['afternoon'],
                    avoidWeekdays: [8],
                    sessionMinutes: 60,
                    maxSessionsPerDay: 2,
                    totalSessionsTarget: 4,
                    focusTopics: ['Python'],
                    summary: 'Ưu tiên học buổi chiều 60 phút và nghỉ Chủ nhật.',
                  }),
                }],
              },
            }],
          }),
        }),
      }
    );
    expect(okRes.source).toBe('neural_gemini');
    expect(okRes.constraints.sessionMinutes).toBe(60);
    expect(okRes.constraints.avoidWeekdays).toEqual([8]);

    // Mock Gemini quota 429 fallback
    const fallbackRes = await parseNaturalConstraints(
      { prompt: 'Ôn tối trước 21h nghỉ chủ nhật', subjectNames: [], useAI: true, dongYGuiAI: true },
      {
        getAiConfig: () => ({ sanSang: true, model: 'gemini-3.5-flash-lite', key: 'x'.repeat(30) }),
        fetchImpl: async () => ({ ok: false, status: 429 }),
      }
    );
    expect(fallbackRes.source).toBe('symbolic_fallback');
    expect(fallbackRes.constraints.latestHour).toBe(21);
    expect(fallbackRes.constraints.avoidWeekdays).toEqual([8]);
  });
});
