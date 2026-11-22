const { tinhDiemMon } = require('../../utils/grade.util');
const { parseVietnamDate } = require('../../utils/date.util');
const { dateKey, plusDays, weekday, weekStart } = require('../thoikhoabieu/adjustments.service');

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const VALID_WINDOWS = new Set(['morning', 'afternoon', 'evening']);
const VALID_SESSION_MINUTES = [60, 90, 120];
const DAY_LABELS = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
};

function vnClockMinutes(date) {
  const vn = new Date(new Date(date).getTime() + VIETNAM_OFFSET_MS);
  return vn.getUTCHours() * 60 + vn.getUTCMinutes();
}

function clockToMinutes(clock) {
  const match = /^([01]?\d|2[0-4]):([0-5]\d)$/.exec(String(clock || '').trim());
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h === 24 && m !== 0) return NaN;
  return h * 60 + m;
}

function minutesToClock(totalMinutes) {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .toLowerCase()
    .trim();
}

function normalizeConstraints(raw = {}) {
  let earliestHour = Number.isInteger(Number(raw.earliestHour)) ? Number(raw.earliestHour) : 7;
  earliestHour = Math.max(5, Math.min(22, earliestHour));

  let latestHour = Number.isInteger(Number(raw.latestHour)) ? Number(raw.latestHour) : 22;
  latestHour = Math.max(8, Math.min(24, latestHour));
  if (latestHour < earliestHour + 2) {
    latestHour = Math.min(24, earliestHour + 2);
    if (latestHour - earliestHour < 2) {
      earliestHour = Math.max(5, latestHour - 2);
    }
  }

  const rawWindows = Array.isArray(raw.preferredWindows) ? raw.preferredWindows.filter((w) => VALID_WINDOWS.has(w)) : [];
  const preferredWindows = rawWindows.length ? [...new Set(rawWindows)] : ['evening', 'afternoon'];

  const avoidWeekdays = Array.isArray(raw.avoidWeekdays)
    ? [...new Set(raw.avoidWeekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 2 && d <= 8))].sort((a, b) => a - b)
    : [];

  let sessionMinutes = Number(raw.sessionMinutes);
  if (!VALID_SESSION_MINUTES.includes(sessionMinutes)) {
    sessionMinutes = 90;
  }

  let breakMinutes = Number.isFinite(Number(raw.breakMinutes)) ? Math.round(Number(raw.breakMinutes)) : 15;
  breakMinutes = Math.max(0, Math.min(60, breakMinutes));

  let maxSessionsPerDay = Number.isInteger(Number(raw.maxSessionsPerDay)) ? Number(raw.maxSessionsPerDay) : 2;
  maxSessionsPerDay = Math.max(1, Math.min(4, maxSessionsPerDay));

  let totalSessionsTarget = Number.isInteger(Number(raw.totalSessionsTarget)) ? Number(raw.totalSessionsTarget) : 6;
  totalSessionsTarget = Math.max(1, Math.min(18, totalSessionsTarget));

  const focusTopics = Array.isArray(raw.focusTopics)
    ? [...new Set(raw.focusTopics.map((t) => String(t || '').trim().slice(0, 80)).filter(Boolean))].slice(0, 6)
    : [];

  return {
    earliestHour,
    latestHour,
    preferredWindows,
    avoidWeekdays,
    sessionMinutes,
    breakMinutes,
    maxSessionsPerDay,
    totalSessionsTarget,
    focusTopics,
  };
}

function getWindowTag(startMin) {
  if (startMin < 12 * 60) return 'morning';
  if (startMin < 18 * 60) return 'afternoon';
  return 'evening';
}

function windowLabel(tag) {
  if (tag === 'morning') return 'buổi sáng';
  if (tag === 'afternoon') return 'buổi chiều';
  return 'buổi tối';
}

function matchesFocus(label, focusTopics) {
  const norm = normalizeText(label);
  if (!norm) return false;
  return focusTopics.find((topic) => {
    const t = normalizeText(topic);
    return t && (norm.includes(t) || t.includes(norm));
  }) || null;
}

function priorityLevelFromScore(score) {
  if (score >= 55) return 'cao';
  if (score >= 25) return 'binh_thuong';
  return 'thap';
}

function buildWeightedTasks({
  deadlines = [],
  subjects = [],
  classes = [],
  focusTopics = [],
  now = new Date(),
  totalSessionsTarget = 6,
}) {
  const nowMs = new Date(now).getTime();
  const candidates = [];
  const matchedFocus = new Set();

  // 1. Pending deadlines
  for (const dl of deadlines) {
    if (!dl || dl.trangThai === 'hoan_thanh' || dl.xoaLuc) continue;
    const dueMs = new Date(dl.hanChot).getTime();
    if (!Number.isFinite(dueMs)) continue;
    const diffDays = (dueMs - nowMs) / 86400000;
    let score = dl.doUuTien === 'cao' ? 40 : dl.doUuTien === 'thap' ? 10 : 22;
    const reasons = [];

    if (dl.doUuTien === 'cao') reasons.push('Deadline mức Khẩn cấp');
    else reasons.push('Deadline sắp tới');

    if (diffDays < 0) {
      score += 35;
      reasons.push('Đã quá hạn cần xử lý ngay');
    } else if (diffDays <= 2) {
      score += 32;
      reasons.push('Cận hạn trong 48 giờ tới');
    } else if (diffDays <= 5) {
      score += 20;
      reasons.push(`Còn ${Math.ceil(diffDays)} ngày tới hạn`);
    } else if (diffDays <= 10) {
      score += 10;
    }

    const subjName = dl.monHoc?.ten || '';
    const focusHit = matchesFocus(`${dl.tieuDe} ${subjName}`, focusTopics);
    if (focusHit) {
      score += 30;
      matchedFocus.add(normalizeText(focusHit));
      reasons.push(`Khớp trọng tâm "${focusHit}"`);
    }

    candidates.push({
      key: `dl-${dl.id}`,
      tieuDe: `Ôn & làm: ${dl.tieuDe}`,
      monHoc: subjName || 'Công việc / Deadline',
      idMonHoc: dl.monHoc?.id || dl.idMonHoc || null,
      priorityScore: score,
      dueDateKey: dateKey(dueMs),
      dueMinutes: vnClockMinutes(dueMs),
      reasons,
      desiredSessions: score >= 60 ? 2 : 1,
    });
  }

  // 2. Academic subjects (prioritize at-risk or unfinished weight subjects)
  for (const sub of subjects) {
    if (!sub?.ten) continue;
    const { diemTrungBinh, tongTrongSo } = tinhDiemMon(sub.diems || []);
    let score = 12;
    const reasons = [];

    if (tongTrongSo > 0 && diemTrungBinh < 5.0) {
      score += 35;
      reasons.push(`Môn nguy cơ điểm thấp (${diemTrungBinh.toFixed(2)}/10)`);
    } else if (tongTrongSo > 0 && diemTrungBinh < 6.5) {
      score += 18;
      reasons.push(`Môn cần củng cố điểm (${diemTrungBinh.toFixed(2)}/10)`);
    } else if (tongTrongSo < 100 - 1e-8) {
      score += 10;
      reasons.push(`Đang học (${tongTrongSo}% trọng số)`);
    } else {
      reasons.push(`Ôn tập môn ${sub.ten}`);
    }

    const focusHit = matchesFocus(sub.ten, focusTopics);
    if (focusHit) {
      score += 30;
      matchedFocus.add(normalizeText(focusHit));
      reasons.push(`Khớp trọng tâm "${focusHit}"`);
    }

    candidates.push({
      key: `sub-${sub.id || normalizeText(sub.ten)}`,
      tieuDe: `Ôn tập: ${sub.ten}`,
      monHoc: sub.ten,
      idMonHoc: sub.id || null,
      priorityScore: score,
      dueDateKey: null,
      dueMinutes: null,
      reasons,
      desiredSessions: score >= 45 ? 2 : 1,
    });
  }

  // 3. Explicit focus topics not matched to an existing deadline or subject
  for (const topic of focusTopics) {
    if (matchedFocus.has(normalizeText(topic))) continue;
    candidates.push({
      key: `focus-${normalizeText(topic)}`,
      tieuDe: `Ôn tập trọng tâm: ${topic}`,
      monHoc: topic,
      idMonHoc: null,
      priorityScore: 45,
      dueDateKey: null,
      dueMinutes: null,
      reasons: [`Trọng tâm theo yêu cầu của bạn ("${topic}")`],
      desiredSessions: 2,
    });
  }

  // 4. Timetable-only fallback when user has no subjects/deadlines yet
  if (!candidates.length && classes.length) {
    const seenClass = new Set();
    for (const c of classes) {
      const name = String(c.tenMon || '').trim();
      const k = normalizeText(name);
      if (!name || seenClass.has(k)) continue;
      seenClass.add(k);
      candidates.push({
        key: `cls-${k}`,
        tieuDe: `Ôn bài: ${name}`,
        monHoc: name,
        idMonHoc: null,
        priorityScore: 20,
        dueDateKey: null,
        dueMinutes: null,
        reasons: [`Củng cố kiến thức môn ${name} từ lịch học`],
        desiredSessions: 1,
      });
    }
  }

  if (!candidates.length) {
    candidates.push({
      key: 'general-study',
      tieuDe: 'Tự học & củng cố kiến thức tuần này',
      monHoc: 'Tự học',
      idMonHoc: null,
      priorityScore: 25,
      dueDateKey: null,
      dueMinutes: null,
      reasons: ['Phiên tự học chủ động giúp giữ nhịp ôn tập đều đặn'],
      desiredSessions: totalSessionsTarget,
    });
  }

  candidates.sort((a, b) => b.priorityScore - a.priorityScore || a.tieuDe.localeCompare(b.tieuDe, 'vi'));

  // Expand tasks into discrete study session requests up to totalSessionsTarget
  const requests = [];
  const counts = new Map();
  let safety = 0;
  while (requests.length < totalSessionsTarget && safety < 50) {
    safety++;
    let addedInRound = false;
    for (const task of candidates) {
      if (requests.length >= totalSessionsTarget) break;
      const used = counts.get(task.key) || 0;
      if (used >= Math.max(task.desiredSessions, safety >= 2 ? 3 : task.desiredSessions)) continue;
      counts.set(task.key, used + 1);
      requests.push({
        ...task,
        partIndex: used + 1,
        priorityLevel: priorityLevelFromScore(task.priorityScore),
      });
      addedInRound = true;
    }
    if (!addedInRound) break;
  }

  return requests;
}

function computeFreeIntervalsForDay({
  date,
  classesForDay = [],
  earliestMin,
  latestMin,
  breakMinutes = 15,
  nowDateKey,
  nowMinutes,
}) {
  if (nowDateKey && date < nowDateKey) {
    return { freeIntervals: [], busyClasses: classesForDay };
  }

  let dayStart = earliestMin;
  if (nowDateKey && date === nowDateKey && Number.isFinite(nowMinutes)) {
    const nextQuarter = Math.ceil((nowMinutes + 15) / 15) * 15;
    dayStart = Math.max(dayStart, nextQuarter);
  }
  if (dayStart >= latestMin) {
    return { freeIntervals: [], busyClasses: classesForDay };
  }

  const blocked = classesForDay
    .map((c) => {
      const s = clockToMinutes(c.gioBatDau);
      const e = clockToMinutes(c.gioKetThuc);
      if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;
      return {
        start: Math.max(dayStart, s - breakMinutes),
        end: Math.min(latestMin, e + breakMinutes),
      };
    })
    .filter((b) => b && b.end > b.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // Merge overlapping blocked intervals
  const merged = [];
  for (const b of blocked) {
    if (!merged.length || b.start > merged[merged.length - 1].end) {
      merged.push({ ...b });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
    }
  }

  const freeIntervals = [];
  let cursor = dayStart;
  for (const b of merged) {
    if (b.start > cursor) {
      freeIntervals.push({ start: cursor, end: b.start });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < latestMin) {
    freeIntervals.push({ start: cursor, end: latestMin });
  }

  return { freeIntervals, busyClasses: classesForDay };
}

function verifyScheduleConstraints({ sessions = [], classes = [], constraints = {} }) {
  const norm = normalizeConstraints(constraints);
  const earliestMin = norm.earliestHour * 60;
  const latestMin = norm.latestHour * 60;
  const avoidSet = new Set(norm.avoidWeekdays);

  let zeroClassOverlap = true;
  let zeroSelfOverlap = true;
  let withinStudyWindow = true;
  let respectsAvoidedDays = true;

  for (let i = 0; i < sessions.length; i++) {
    const a = sessions[i];
    const aStart = clockToMinutes(a.gioBatDau);
    const aEnd = clockToMinutes(a.gioKetThuc);
    if (!Number.isFinite(aStart) || !Number.isFinite(aEnd) || aStart < earliestMin || aEnd > latestMin) {
      withinStudyWindow = false;
    }
    if (avoidSet.has(Number(a.thu))) {
      respectsAvoidedDays = false;
    }
    for (const c of classes) {
      const cDay = c.ngayHoc || '';
      const matchesDay = cDay ? cDay === a.ngayHoc : Number(c.thu) === Number(a.thu);
      if (!matchesDay) continue;
      const cStart = clockToMinutes(c.gioBatDau);
      const cEnd = clockToMinutes(c.gioKetThuc);
      if (aStart < cEnd && aEnd > cStart) {
        zeroClassOverlap = false;
      }
    }
    for (let j = i + 1; j < sessions.length; j++) {
      const b = sessions[j];
      if (a.ngayHoc !== b.ngayHoc) continue;
      const bStart = clockToMinutes(b.gioBatDau);
      const bEnd = clockToMinutes(b.gioKetThuc);
      if (aStart < bEnd && aEnd > bStart) {
        zeroSelfOverlap = false;
      }
    }
  }

  return {
    valid: zeroClassOverlap && zeroSelfOverlap && withinStudyWindow && respectsAvoidedDays,
    zeroClassOverlap,
    zeroSelfOverlap,
    withinStudyWindow,
    respectsAvoidedDays,
    totalChecked: sessions.length,
  };
}

function solveStudySchedule({
  weekStartDate,
  classes = [],
  deadlines = [],
  subjects = [],
  constraints = {},
  now = new Date(),
}) {
  const norm = normalizeConstraints(constraints);
  const start = weekStart(weekStartDate || dateKey(now));
  const end = plusDays(start, 6);
  const nowDateKey = dateKey(now);
  const nowMinutes = vnClockMinutes(now);
  const earliestMin = norm.earliestHour * 60;
  const latestMin = norm.latestHour * 60;
  const avoidSet = new Set(norm.avoidWeekdays);

  // Build day schedule map & candidate slots
  const classesByDate = new Map();
  for (let offset = 0; offset < 7; offset++) {
    const d = plusDays(start, offset);
    classesByDate.set(d, []);
  }
  for (const c of classes) {
    const targetDate = c.ngayHoc || (Number.isInteger(Number(c.thu)) ? plusDays(start, Number(c.thu) - 2) : '');
    if (classesByDate.has(targetDate)) {
      classesByDate.get(targetDate).push(c);
    }
  }

  const candidateSlots = [];
  for (let offset = 0; offset < 7; offset++) {
    const d = plusDays(start, offset);
    const thu = weekday(d);
    if (avoidSet.has(thu)) continue;
    const classesForDay = classesByDate.get(d) || [];
    const { freeIntervals } = computeFreeIntervalsForDay({
      date: d,
      classesForDay,
      earliestMin,
      latestMin,
      breakMinutes: norm.breakMinutes,
      nowDateKey,
      nowMinutes,
    });
    for (const iv of freeIntervals) {
      for (let t = iv.start; t + norm.sessionMinutes <= iv.end; t += 30) {
        candidateSlots.push({
          date: d,
          thu,
          start: t,
          end: t + norm.sessionMinutes,
          windowTag: getWindowTag(t),
          dayClassCount: classesForDay.length,
        });
      }
    }
  }

  const requests = buildWeightedTasks({
    deadlines,
    subjects,
    classes,
    focusTopics: norm.focusTopics,
    now,
    totalSessionsTarget: norm.totalSessionsTarget,
  });

  const sessions = [];
  const unscheduled = [];
  const sessionsPerDay = new Map();

  for (let idx = 0; idx < requests.length; idx++) {
    const reqTask = requests[idx];
    const eligible = candidateSlots.filter((slot) => {
      if ((sessionsPerDay.get(slot.date) || 0) >= norm.maxSessionsPerDay) return false;

      // Never overlap already scheduled study sessions (+ break buffer)
      const conflictsExisting = sessions.some(
        (s) => s.ngayHoc === slot.date && slot.start < s._end + norm.breakMinutes && slot.end + norm.breakMinutes > s._start
      );
      if (conflictsExisting) return false;

      // Respect deadline within the week if due date falls inside this week
      if (reqTask.dueDateKey && reqTask.dueDateKey >= start && reqTask.dueDateKey <= end) {
        if (slot.date > reqTask.dueDateKey) return false;
        if (slot.date === reqTask.dueDateKey && Number.isFinite(reqTask.dueMinutes) && slot.end > reqTask.dueMinutes) {
          return false;
        }
      }
      return true;
    });

    if (!eligible.length) {
      unscheduled.push({
        tieuDe: reqTask.tieuDe,
        monHoc: reqTask.monHoc,
        reasons: ['Không còn khung giờ trống thỏa mãn ràng buộc ngày nghỉ / giới hạn giờ / hạn chót trong tuần.'],
      });
      continue;
    }

    let bestSlot = null;
    let bestScore = -Infinity;
    for (const slot of eligible) {
      let sScore = 0;
      const prefIndex = norm.preferredWindows.indexOf(slot.windowTag);
      if (prefIndex === 0) sScore += 28;
      else if (prefIndex > 0) sScore += 18;
      else sScore += 4;

      // Spread load across days
      sScore += 14 - (sessionsPerDay.get(slot.date) || 0) * 6;
      // Avoid duplicate subject on same day unless needed
      if (sessions.some((s) => s.ngayHoc === slot.date && normalizeText(s.monHoc) === normalizeText(reqTask.monHoc))) {
        sScore -= 10;
      }
      // Early buffer before due date
      if (reqTask.dueDateKey && slot.date < reqTask.dueDateKey) {
        sScore += 12;
      }
      // Prefer earlier in week when tie
      sScore -= (parseVietnamDate(slot.date).getTime() - parseVietnamDate(start).getTime()) / 86400000;

      if (sScore > bestScore) {
        bestScore = sScore;
        bestSlot = slot;
      }
    }

    const dayClasses = classesByDate.get(bestSlot.date) || [];
    const reasons = [...reqTask.reasons];
    if (norm.preferredWindows.includes(bestSlot.windowTag)) {
      reasons.push(`Khớp khung ${windowLabel(bestSlot.windowTag)} ưu tiên`);
    }
    if (dayClasses.length > 0) {
      reasons.push(`Tránh ${dayClasses.length} buổi học trong ${DAY_LABELS[bestSlot.thu]} (cách tối thiểu ${norm.breakMinutes} phút)`);
    } else {
      reasons.push(`${DAY_LABELS[bestSlot.thu]} trống lịch lên lớp`);
    }
    if (reqTask.dueDateKey && bestSlot.date <= reqTask.dueDateKey) {
      reasons.push(`Hoàn thành trước hạn ${reqTask.dueDateKey.split('-').reverse().join('/')}`);
    }

    sessions.push({
      id: `plan-${bestSlot.date}-${bestSlot.start}-${idx}`,
      ngayHoc: bestSlot.date,
      thu: bestSlot.thu,
      gioBatDau: minutesToClock(bestSlot.start),
      gioKetThuc: minutesToClock(bestSlot.end),
      durationMinutes: norm.sessionMinutes,
      tieuDe: reqTask.tieuDe,
      monHoc: reqTask.monHoc,
      idMonHoc: reqTask.idMonHoc,
      priorityScore: reqTask.priorityScore,
      priorityLevel: reqTask.priorityLevel,
      windowTag: bestSlot.windowTag,
      reasons: reasons.slice(0, 4),
      _start: bestSlot.start,
      _end: bestSlot.end,
    });
    sessionsPerDay.set(bestSlot.date, (sessionsPerDay.get(bestSlot.date) || 0) + 1);
  }

  sessions.sort((a, b) => a.ngayHoc.localeCompare(b.ngayHoc) || a.gioBatDau.localeCompare(b.gioBatDau));
  const cleanSessions = sessions.map(({ _start, _end, ...rest }) => rest);

  const verification = verifyScheduleConstraints({
    sessions: cleanSessions,
    classes,
    constraints: norm,
  });

  const riskSubjectCount = subjects.filter((sub) => {
    const { diemTrungBinh, tongTrongSo } = tinhDiemMon(sub.diems || []);
    return tongTrongSo > 0 && diemTrungBinh < 5.0;
  }).length;

  return {
    weekStart: start,
    weekEnd: end,
    constraints: norm,
    sessions: cleanSessions,
    unscheduled,
    verification,
    stats: {
      scheduledCount: cleanSessions.length,
      totalHours: Math.round(((cleanSessions.length * norm.sessionMinutes) / 60) * 10) / 10,
      avoidedClassCount: classes.length,
      riskSubjectCount,
      upcomingDeadlineCount: deadlines.filter((d) => !d.xoaLuc && d.trangThai !== 'hoan_thanh').length,
    },
  };
}

module.exports = {
  normalizeConstraints,
  clockToMinutes,
  minutesToClock,
  buildWeightedTasks,
  computeFreeIntervalsForDay,
  verifyScheduleConstraints,
  solveStudySchedule,
};
