const { validateFeedbackPayload } = require('../../src/modules/feedback/feedback.routes');

describe('feedback.routes validateFeedbackPayload', () => {
  test('rejects short title or content', () => {
    expect(validateFeedbackPayload({ loai: 'loi', tieuDe: 'ab', noiDung: 'Đủ mười ký tự trở lên' }).error)
      .toMatch(/ít nhất 3 ký tự/);
    expect(validateFeedbackPayload({ loai: 'gop_y', tieuDe: 'Đủ tiêu đề', noiDung: 'Quá ngắn' }).error)
      .toMatch(/ít nhất 10 ký tự/);
  });

  test('normalizes allowed feedback categories and trims control characters', () => {
    const valid = validateFeedbackPayload({
      loai: 'ocr',
      tieuDe: '  Hóa đơn tối bị thiếu tiền\u0000  ',
      noiDung: '  Ảnh chụp dưới đèn vàng nhận sai số 0 thành O.  ',
      trang: '/tai-chinh',
    });
    expect(valid.error).toBeUndefined();
    expect(valid.data).toEqual({
      loai: 'ocr',
      tieuDe: 'Hóa đơn tối bị thiếu tiền',
      noiDung: 'Ảnh chụp dưới đèn vàng nhận sai số 0 thành O.',
      trang: '/tai-chinh',
    });

    const fallbackType = validateFeedbackPayload({
      loai: 'unknown_type',
      tieuDe: 'Góp ý giao diện',
      noiDung: 'Nên thêm nút xuất lịch học sang Google Calendar.',
    });
    expect(fallbackType.data.loai).toBe('gop_y');
    expect(fallbackType.data.trang).toBe('/');
  });
});
