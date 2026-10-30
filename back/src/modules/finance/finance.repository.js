const prisma = require('../../prismaClient');
// Return only grouped amounts for summaries. Raw descriptions/dates stay out of summary reads.
async function tongHopGiaoDich(where) {
  const groups = await prisma.giaoDich.groupBy({ by: ['loai', 'danhMuc'], where, _sum: { soTien: true } });
  return groups.map(group => ({ loai: group.loai, danhMuc: group.danhMuc, soTien: group._sum.soTien || 0 }));
}
module.exports = { tongHopGiaoDich };
