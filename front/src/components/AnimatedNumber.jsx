import { useEffect, useState } from 'react';
import { useMotionValue, animate } from 'framer-motion';

/**
 * Đếm số chạy mượt khi giá trị thay đổi (GPA, deadline, số dư...).
 * value: số cần hiển thị (number). format: hàm định dạng số hiện tại -> chuỗi hiển thị.
 */
function AnimatedNumber({ value, format = (v) => Math.round(v).toString(), duration = 0.9 }) {
  const motionVal = useMotionValue(0);
  const [hienThi, setHienThi] = useState(format(0));

  useEffect(() => {
    const diem = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    const controls = animate(motionVal, diem, { duration, ease: 'easeOut' });
    const huyLangNghe = motionVal.on('change', (v) => setHienThi(format(v)));
    return () => {
      controls.stop();
      huyLangNghe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (value === null || value === undefined) return '--';
  return hienThi;
}

export default AnimatedNumber;
