/**
 * constants.js
 * Tập trung toàn bộ hằng số cấu hình của hệ thống Backend Student Life Hub
 * Tránh magic numbers và hardcoded strings rải rác trong code.
 */

// 1. Cấu hình Xác thực & Bảo mật (Auth)
const AUTH = {
  SALT_ROUNDS: 10,
  JWT_EXPIRY: '7d',
  RESET_TOKEN_EXPIRY_MS: 15 * 60 * 1000, // 15 phút
  MIN_PASSWORD_LENGTH: 6,
  MAX_TEN_LENGTH: 100,
  MAX_TRUONG_LENGTH: 200,
  MAX_NGANH_LENGTH: 200,
  MAX_KHOA_HOC_LENGTH: 50,
  MAX_AVATAR_LENGTH: 500,
  DUMMY_HASH: '$2a$10$w8T9c9f2R7wKzF9z1sK6I.VbC9X0K1G8k8Q2X0y7Z3o6U5k7L2vWq',
};

// 2. Cấu hình Tài chính & Ngân sách (Finance)
const FINANCE = {
  DANH_MUC_CHI: ['an_uong', 'hoc_phi', 'tro', 'giai_tri', 'di_lai', 'khac'],
  DANH_MUC_THU: ['luong', 'hoc_bong', 'tro_cap', 'thuong', 'khac'],
  MAX_EXPORT_RECORDS: 10000,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TREND_MONTHS: 6,
};
FINANCE.DANH_MUC_HOP_LE = [...new Set([...FINANCE.DANH_MUC_CHI, ...FINANCE.DANH_MUC_THU])];

// 3. Cấu hình Học tập & Điểm số (Academic)
const ACADEMIC = {
  MAX_TIN_CHI_MON: 20,
  MIN_TIN_CHI_MON: 1,
  DEFAULT_NGUONG_CANH_BAO: 5.0,
  THANG_DIEM_MAX: 10.0,
  THANG_DIEM_MIN: 0.0,
  TONG_TRONG_SO_CHUAN: 100,
};

// 4. Cấu hình Deadline & Công việc
const DEADLINE = {
  TRANG_THAI: ['dang_dien_hanh', 'hoan_thanh', 'cho_xu_ly'],
  DO_UU_TIEN: ['thap', 'binh_thuong', 'cao'],
  MAC_DINH_DO_UU_TIEN: 'binh_thuong',
  MAC_DINH_TRANG_THAI: 'dang_dien_hanh',
};

// 5. Cấu hình Thời khóa biểu
const THOIKHOABIEU = {
  THU_MIN: 2, // Thứ 2
  THU_MAX: 8, // Chủ nhật
  MAX_TEN_MON_LENGTH: 100,
  MAX_PHONG_HOC_LENGTH: 50,
  MAX_GIANG_VIEN_LENGTH: 100,
};

// 6. Cấu hình Chatbot AI
const CHATBOT = {
  DEFAULT_MODEL: 'gemini-1.5-flash',
  TIMEOUT_MS: 15000,
  MAX_HISTORY_LENGTH: 10,
};

// 7. Cấu hình Rate Limiting (Số lượt / Khoảng thời gian)
const RATE_LIMIT = {
  GLOBAL_WINDOW_MS: 15 * 60 * 1000,
  GLOBAL_MAX: 300,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 10,
  CHATBOT_WINDOW_MS: 5 * 60 * 1000,
  CHATBOT_MAX: 20,
  CRON_TEST_WINDOW_MS: 10 * 60 * 1000,
  CRON_TEST_MAX: 5,
};

module.exports = {
  AUTH,
  FINANCE,
  ACADEMIC,
  DEADLINE,
  THOIKHOABIEU,
  CHATBOT,
  RATE_LIMIT,
};
