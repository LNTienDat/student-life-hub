const prisma = require('../../prismaClient');
const { filterSemester } = require('../../utils/semester.util');
const { dateKey } = require('../thoikhoabieu/adjustments.service');
const { loadWeek } = require('../thoikhoabieu/adjustments.service');
const { parseNaturalConstraints } = require('./neural.parser');
const { solveStudySchedule, normalizeConstraints } = require('./symbolic.solver');

async function taoKeHoachOnTap(req, res) {
  try {
    const userId = req.user.id;
    const {
      prompt = '',
      weekStart: rawWeekStart = '',
      semester = '',
      constraints: overrides = {},
      useAI = true,
      dongYGuiAI = false,
    } = req.body || {};

    if (typeof prompt !== 'string' || prompt.length > 600) {
      return res.status(400).json({ message: 'Mô tả mong muốn tối đa 600 ký tự.' });
    }

    const [allClasses, deadlines, allSubjects] = await Promise.all([
      prisma.thoiKhoaBieu.findMany({ where: { idNguoiDung: userId } }),
      prisma.deadline.findMany({
        where: { idNguoiDung: userId, xoaLuc: null, trangThai: { not: 'hoan_thanh' } },
        include: { monHoc: { select: { id: true, ten: true } } },
        orderBy: { hanChot: 'asc' },
      }),
      prisma.monHoc.findMany({
        where: { idNguoiDung: userId },
        include: { diems: true },
      }),
    ]);

    const filteredBase = semester ? filterSemester(allClasses, semester, true) : allClasses;
    const targetWeekStart = typeof rawWeekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawWeekStart)
      ? rawWeekStart
      : dateKey(new Date());
    const weekData = await loadWeek(prisma, userId, filteredBase, targetWeekStart);
    const subjects = semester ? filterSemester(allSubjects, semester, false) : allSubjects;

    const subjectNames = [...new Set([
      ...subjects.map((s) => String(s.ten || '').trim()),
      ...filteredBase.map((c) => String(c.tenMon || '').trim()),
    ].filter(Boolean))];

    const neural = await parseNaturalConstraints({
      prompt,
      subjectNames,
      useAI: Boolean(useAI),
      dongYGuiAI: Boolean(dongYGuiAI),
    });

    const cleanOverrides = {};
    if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
      for (const key of ['earliestHour', 'latestHour', 'preferredWindows', 'avoidWeekdays', 'sessionMinutes', 'breakMinutes', 'maxSessionsPerDay', 'totalSessionsTarget', 'focusTopics']) {
        if (overrides[key] !== undefined) cleanOverrides[key] = overrides[key];
      }
    }

    const finalConstraints = normalizeConstraints({
      ...neural.constraints,
      ...cleanOverrides,
    });

    const plan = solveStudySchedule({
      weekStartDate: targetWeekStart,
      classes: weekData.thoiKhoaBieu,
      deadlines,
      subjects,
      constraints: finalConstraints,
      now: new Date(),
    });

    return res.json({
      engine: 'neuro-symbolic-v1',
      neural: {
        source: neural.source,
        model: neural.model,
        summary: neural.summary,
      },
      ...plan,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Chưa tạo được kế hoạch ôn tập. Vui lòng thử lại.',
    });
  }
}

async function luuKeHoachThanhDeadline(req, res) {
  try {
    const userId = req.user.id;
    const sessions = Array.isArray(req.body?.sessions) ? req.body.sessions : [];
    if (!sessions.length || sessions.length > 20) {
      return res.status(400).json({ message: 'Chọn từ 1 đến 20 phiên ôn tập để lưu.' });
    }

    const normalized = [];
    const subjectIds = new Set();
    for (const s of sessions) {
      const tieuDe = typeof s?.tieuDe === 'string' ? s.tieuDe.trim() : '';
      const ngayHoc = typeof s?.ngayHoc === 'string' ? s.ngayHoc.trim() : '';
      const gioBatDau = typeof s?.gioBatDau === 'string' ? s.gioBatDau.trim() : '';
      const gioKetThuc = typeof s?.gioKetThuc === 'string' ? s.gioKetThuc.trim() : '';

      if (
        !tieuDe ||
        tieuDe.length > 180 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(ngayHoc) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(gioBatDau) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(gioKetThuc)
      ) {
        return res.status(400).json({ message: 'Dữ liệu phiên ôn tập không hợp lệ.' });
      }
      const dueDate = new Date(`${ngayHoc}T${gioKetThuc}:00+07:00`);
      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Thời gian phiên ôn tập không hợp lệ.' });
      }

      const idMonHoc = Number.isInteger(Number(s?.idMonHoc)) && Number(s.idMonHoc) > 0 ? Number(s.idMonHoc) : null;
      if (idMonHoc) subjectIds.add(idMonHoc);

      const prefixTitle = tieuDe.startsWith('[Ôn tập]') ? tieuDe : `[Ôn tập] ${tieuDe}`;
      const finalTitle = `${prefixTitle} (${gioBatDau}–${gioKetThuc})`.slice(0, 200);
      const reasons = Array.isArray(s?.reasons) ? s.reasons.map((r) => String(r || '').trim()).filter(Boolean) : [];
      const moTa = reasons.length ? `Lịch Neuro-Symbolic AI:\n- ${reasons.join('\n- ')}` : 'Phiên ôn tập từ Neuro-Symbolic AI';
      const doUuTien = ['cao', 'binh_thuong', 'thap'].includes(s?.priorityLevel) ? s.priorityLevel : 'binh_thuong';

      normalized.push({
        tieuDe: finalTitle,
        moTa,
        hanChot: dueDate,
        doUuTien,
        trangThai: 'dang_dien_hanh',
        idMonHoc,
      });
    }

    if (subjectIds.size) {
      const owned = await prisma.monHoc.findMany({
        where: { idNguoiDung: userId, id: { in: [...subjectIds] } },
        select: { id: true },
      });
      const ownedSet = new Set(owned.map((m) => m.id));
      for (const item of normalized) {
        if (item.idMonHoc && !ownedSet.has(item.idMonHoc)) {
          item.idMonHoc = null;
        }
      }
    }

    const created = await prisma.$transaction(
      normalized.map((item) => prisma.deadline.create({ data: { ...item, idNguoiDung: userId } }))
    );

    return res.status(201).json({
      message: `Đã lưu ${created.length} phiên ôn tập vào Deadline.`,
      count: created.length,
      deadlines: created,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Chưa lưu được kế hoạch vào Deadline.' });
  }
}

module.exports = {
  taoKeHoachOnTap,
  luuKeHoachThanhDeadline,
};
