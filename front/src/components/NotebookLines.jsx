/**
 * Họa tiết "trang sổ tay" — dòng kẻ ngang mảnh + đường lề đỏ dọc, đúng ẩn dụ
 * thiết kế xuyên suốt (planner/notebook). Dùng làm nền panel thương hiệu,
 * không phải hoạ tiết trang trí ngẫu nhiên.
 */
function NotebookLines({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="notebook-ruled" width="400" height="32" patternUnits="userSpaceOnUse">
          <line x1="0" y1="32" x2="400" y2="32" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#notebook-ruled)" />
      <line x1="48" y1="0" x2="48" y2="600" stroke="rgba(217,119,6,0.35)" strokeWidth="1.5" />
    </svg>
  );
}

export default NotebookLines;
