async function serializable(prisma, action) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await prisma.$transaction(action, { isolationLevel: 'Serializable' }); }
    catch (error) { if (error.code !== 'P2034' || attempt === 2) throw error; }
  }
}
function httpError(statusCode, message) { return Object.assign(new Error(message), { statusCode }); }
module.exports = { serializable, httpError };
