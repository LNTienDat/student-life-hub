import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, Lock, FileText } from 'lucide-react';
import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';

export default function ChinhSach() {
  useLanguage();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={user ? '/ho-so' : '/login'}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {user ? tr('Quay lại Hồ sơ') : tr('Quay lại Đăng nhập')}
          </Link>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr('Cập nhật: 18/11/2026 · Student Life Hub (LifeHub)')}
          </span>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {tr('Chính sách bảo mật & Điều khoản sử dụng')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('LifeHub được xây dựng để giúp sinh viên quản lý thời khóa biểu, điểm số, deadline, tài chính cá nhân và tài liệu học tập an toàn, minh bạch.')}
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{tr('1. Dữ liệu cá nhân & Quyền riêng tư')}</h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>{tr('Tài khoản, môn học, điểm số, deadline, giao dịch tài chính và tài liệu tải lên được lưu tách biệt theo từng tài khoản người dùng trên cơ sở dữ liệu PostgreSQL.')}</li>
            <li>{tr('Mật khẩu luôn được băm một chiều (bcrypt) trước khi lưu. Phiên đăng nhập sử dụng JWT với kết nối HTTPS ở môi trường phát hành.')}</li>
            <li>{tr('Bạn có toàn quyền xuất dữ liệu (Excel chi tiêu, lịch .ics) hoặc xóa bỏ môn học, deadline, lịch học, tài liệu bất kỳ lúc nào.')}</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{tr('2. Cơ chế xử lý Ảnh (OCR) & Trợ lý AI')}</h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>{tr('Chế độ quét mặc định bằng Tesseract chạy trực tiếp trên trình duyệt của bạn; ảnh hóa đơn và ảnh thời khóa biểu không rời khỏi thiết bị khi dùng chế độ này.')}</li>
            <li>{tr('Chỉ khi bạn chủ động bấm “Quét lại bằng AI Vision” hoặc bật tùy chọn gửi dữ liệu đến Google AI trong Trợ lý học tập, ảnh đã nén hoặc câu hỏi/trích đoạn tài liệu mới được gửi đến Google Gemini API để phân tích.')}</li>
            <li>{tr('Kết quả AI và OCR chỉ mang tính hỗ trợ nhập liệu và tham khảo; bạn luôn được xem trước và chỉnh sửa trước khi lưu chính thức.')}</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{tr('3. Điều khoản sử dụng & Chia sẻ lịch')}</h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>{tr('Không tải lên tài liệu vi phạm pháp luật, chứa mã độc hoặc lạm dụng API AI/Email gây ảnh hưởng đến người dùng khác.')}</li>
            <li>{tr('Liên kết chia sẻ Thời khóa biểu chỉ công khai đúng phạm vi học kỳ bạn đã chọn và có thể tắt hoặc tạo mã mới bất kỳ lúc nào.')}</li>
            <li>{tr('Khi phát hiện lỗi hoặc cần hỗ trợ, bạn có thể gửi trực tiếp trong mục Góp ý & Báo lỗi tại trang Hồ sơ.')}</li>
          </ul>
        </section>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Student Life Hub · Privacy-first Student Workspace</span>
        </div>
      </div>
    </div>
  );
}
