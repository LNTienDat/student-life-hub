/**
 * Tạo middleware Express xác thực req.body bằng schema Zod.
 * Trả về HTTP 400 với thông điệp tiếng Việt đầu tiên nếu dữ liệu không hợp lệ.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const firstIssue = parsed.error?.issues?.[0];
      return res.status(400).json({
        message: firstIssue?.message || 'Dữ liệu gửi lên không hợp lệ.',
      });
    }
    req.body = parsed.data;
    return next();
  };
}

module.exports = {
  validateBody,
};
