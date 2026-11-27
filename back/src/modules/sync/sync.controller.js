const prisma = require('../../prismaClient');

const MAX_SYNC_PAYLOAD_BYTES = 350_000;

function exceedPayloadSize(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_SYNC_PAYLOAD_BYTES;
}

async function getSm2Deck(req, res) {
  try {
    const row = await prisma.boTheOnTap.findUnique({
      where: { idNguoiDung: req.user.id },
    });

    if (!row) {
      return res.json({ deck: null });
    }

    return res.json({
      deck: {
        version: row.phienBan,
        userId: req.user.id,
        totalReviews: row.tongLuotOn,
        cards: Array.isArray(row.cacThe) ? row.cacThe : [],
        updatedAt: row.capNhatLuc.getTime(),
      },
    });
  } catch (error) {
    console.error('getSm2Deck error:', error);
    return res.status(503).json({ message: 'Chưa tải được dữ liệu bộ thẻ ôn tập.' });
  }
}

async function putSm2Deck(req, res) {
  try {
    const { version, totalReviews, cards } = req.body;
    if (exceedPayloadSize(cards)) {
      return res.status(413).json({ message: 'Dữ liệu bộ thẻ ôn tập vượt quá giới hạn đồng bộ.' });
    }

    const row = await prisma.boTheOnTap.upsert({
      where: { idNguoiDung: req.user.id },
      create: {
        idNguoiDung: req.user.id,
        phienBan: version,
        tongLuotOn: totalReviews,
        cacThe: cards,
      },
      update: {
        phienBan: version,
        tongLuotOn: totalReviews,
        cacThe: cards,
      },
    });

    return res.json({
      deck: {
        version: row.phienBan,
        userId: req.user.id,
        totalReviews: row.tongLuotOn,
        cards: Array.isArray(row.cacThe) ? row.cacThe : [],
        updatedAt: row.capNhatLuc.getTime(),
      },
    });
  } catch (error) {
    console.error('putSm2Deck error:', error);
    return res.status(503).json({ message: 'Chưa lưu đồng bộ được bộ thẻ ôn tập.' });
  }
}

async function deleteSm2Deck(req, res) {
  try {
    await prisma.boTheOnTap.deleteMany({
      where: { idNguoiDung: req.user.id },
    });
    return res.json({ message: 'Đã xóa dữ liệu bộ thẻ ôn tập đồng bộ.' });
  } catch (error) {
    console.error('deleteSm2Deck error:', error);
    return res.status(503).json({ message: 'Chưa xóa được dữ liệu bộ thẻ ôn tập.' });
  }
}

async function getEdgeModel(req, res) {
  try {
    const row = await prisma.moHinhEdgeAi.findUnique({
      where: { idNguoiDung: req.user.id },
    });

    if (!row) {
      return res.json({ model: null });
    }

    return res.json({
      model: {
        version: row.phienBan,
        userId: req.user.id,
        updatedAt: row.capNhatLuc.getTime(),
        tasks: row.duLieu && typeof row.duLieu === 'object' ? row.duLieu : {},
      },
    });
  } catch (error) {
    console.error('getEdgeModel error:', error);
    return res.status(503).json({ message: 'Chưa tải được dữ liệu gợi ý đồng bộ.' });
  }
}

async function putEdgeModel(req, res) {
  try {
    const { version, tasks } = req.body;
    if (exceedPayloadSize(tasks)) {
      return res.status(413).json({ message: 'Dữ liệu gợi ý vượt quá giới hạn đồng bộ.' });
    }

    const row = await prisma.moHinhEdgeAi.upsert({
      where: { idNguoiDung: req.user.id },
      create: {
        idNguoiDung: req.user.id,
        phienBan: version,
        duLieu: tasks,
      },
      update: {
        phienBan: version,
        duLieu: tasks,
      },
    });

    return res.json({
      model: {
        version: row.phienBan,
        userId: req.user.id,
        updatedAt: row.capNhatLuc.getTime(),
        tasks: row.duLieu && typeof row.duLieu === 'object' ? row.duLieu : {},
      },
    });
  } catch (error) {
    console.error('putEdgeModel error:', error);
    return res.status(503).json({ message: 'Chưa lưu đồng bộ được dữ liệu gợi ý.' });
  }
}

async function deleteEdgeModel(req, res) {
  try {
    await prisma.moHinhEdgeAi.deleteMany({
      where: { idNguoiDung: req.user.id },
    });
    return res.json({ message: 'Đã đặt lại dữ liệu gợi ý đồng bộ.' });
  } catch (error) {
    console.error('deleteEdgeModel error:', error);
    return res.status(503).json({ message: 'Chưa đặt lại được dữ liệu gợi ý.' });
  }
}

module.exports = {
  getSm2Deck,
  putSm2Deck,
  deleteSm2Deck,
  getEdgeModel,
  putEdgeModel,
  deleteEdgeModel,
};
