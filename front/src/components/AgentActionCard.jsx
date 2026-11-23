import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Loader2, X } from 'lucide-react';
import { useFinanceCategories } from '../context/FinanceCategoryContext';
import { useCurrentSemester } from '../context/SemesterContext';
import { useToast } from '../context/ToastContext';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import { deadlineToISO } from '../pages/deadline/deadlineDate';
import deadlineService from '../services/deadlineService';
import {
  predictFinanceCategory,
  trainDeadlineSample,
  trainFinanceSample,
} from '../services/edgeAiService';
import financeService from '../services/financeService';
import timetableService from '../services/timetableService';
import { categoryDisplayName } from '../utils/categoryDisplayName';
import { validDong } from '../utils/money';

const inputCls = 'w-full min-h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

function splitDeadlineValue(raw) {
  const value = String(raw || '');
  if (value.includes('T')) {
    const [datePart, timePart] = value.split('T');
    return { dueDate: datePart, dueTime: (timePart || '').slice(0, 5) };
  }
  return { dueDate: value, dueTime: '' };
}

export default function AgentActionCard({ action, userId, onNavigate }) {
  useLanguage();
  const { categories } = useFinanceCategories();
  const { currentSemester } = useCurrentSemester();
  const { hienToast } = useToast();

  const [status, setStatus] = useState('pending'); // 'pending' | 'executing' | 'executed' | 'cancelled'
  const [error, setError] = useState('');
  const [fields, setFields] = useState(() => {
    const params = { ...(action?.params || {}) };
    if (action?.tool === 'create_deadline') {
      const { dueDate, dueTime } = splitDeadlineValue(params.hanChot);
      return { ...params, dueDate, dueTime };
    }
    if ((action?.tool === 'create_transaction' || action?.tool === 'set_budget') && params.danhMuc === 'khac') {
      const pred = predictFinanceCategory({
        userId,
        text: params.moTa || '',
        amount: params.soTien || params.soTienToiDa,
        loai: params.loai || 'chi',
        categories,
      });
      if (pred && pred.confidence >= 0.48 && pred.label !== 'khac') {
        params.danhMuc = pred.label;
      }
    }
    return params;
  });

  const activeCategoryType = action?.tool === 'set_budget' ? 'chi' : (fields.loai || 'chi');
  const categoryOptions = useMemo(() => {
    const active = categories.filter((c) => c.loai === activeCategoryType && !c.daAn);
    if (active.length && !active.some((c) => c.ma === fields.danhMuc)) {
      const matched = categories.find((c) => c.loai === activeCategoryType && c.ma === fields.danhMuc);
      return matched ? [...active, matched] : active;
    }
    return active;
  }, [categories, activeCategoryType, fields.danhMuc]);

  if (!action) return null;

  function updateField(key, value) {
    setError('');
    setFields((prev) => {
      if (key === 'loai' && value !== prev.loai) {
        const nextCat = value === 'thu' ? 'luong' : 'an_uong';
        return { ...prev, loai: value, danhMuc: nextCat };
      }
      return { ...prev, [key]: value };
    });
  }

  async function handleExecute(event) {
    event.preventDefault();
    if (status !== 'pending') return;
    setError('');

    try {
      if (action.tool === 'create_transaction') {
        const amount = Number(fields.soTien);
        if (!validDong(amount)) {
          setError('Vui lòng nhập số tiền hợp lệ (số nguyên dương).');
          return;
        }
        if (!fields.danhMuc) {
          setError('Vui lòng chọn danh mục.');
          return;
        }
        setStatus('executing');
        await financeService.themGiaoDich({
          loai: fields.loai === 'thu' ? 'thu' : 'chi',
          danhMuc: fields.danhMuc,
          soTien: amount,
          moTa: String(fields.moTa || '').trim(),
          ngayGiaoDich: fields.ngayGiaoDich,
        });
        if (userId && String(fields.moTa || '').trim()) {
          trainFinanceSample({
            userId,
            loai: fields.loai === 'thu' ? 'thu' : 'chi',
            danhMuc: fields.danhMuc,
            moTa: String(fields.moTa).trim(),
            soTien: amount,
            weight: 2,
          });
        }
      } else if (action.tool === 'create_deadline') {
        const tieuDe = String(fields.tieuDe || '').trim();
        if (!tieuDe) {
          setError('Vui lòng nhập tên công việc.');
          return;
        }
        const combined = fields.dueTime ? `${fields.dueDate}T${fields.dueTime}` : fields.dueDate;
        const hanChot = deadlineToISO(combined);
        setStatus('executing');
        await deadlineService.themDeadline({
          tieuDe,
          hanChot,
          doUuTien: fields.doUuTien || 'binh_thuong',
        });
        if (userId) {
          trainDeadlineSample({
            userId,
            tieuDe,
            hanChot,
            doUuTien: fields.doUuTien || 'binh_thuong',
            weight: 2,
          });
        }
      } else if (action.tool === 'create_class_session') {
        const tenMon = String(fields.tenMon || '').trim();
        if (!tenMon) {
          setError('Vui lòng nhập tên môn học.');
          return;
        }
        if (!fields.gioBatDau || !fields.gioKetThuc || fields.gioKetThuc <= fields.gioBatDau) {
          setError('Giờ kết thúc phải sau giờ bắt đầu.');
          return;
        }
        setStatus('executing');
        await timetableService.themBuoiHoc({
          tenMon,
          thu: Number(fields.thu),
          gioBatDau: fields.gioBatDau,
          gioKetThuc: fields.gioKetThuc,
          phongHoc: String(fields.phongHoc || '').trim(),
          giangVien: String(fields.giangVien || '').trim(),
          hocKy: currentSemester || '',
        });
      } else if (action.tool === 'set_budget') {
        const amount = Number(fields.soTienToiDa);
        const thang = Number(fields.thang);
        const nam = Number(fields.nam);
        if (!validDong(amount)) {
          setError('Vui lòng nhập hạn mức hợp lệ (số nguyên dương).');
          return;
        }
        if (!Number.isInteger(thang) || thang < 1 || thang > 12 || !Number.isInteger(nam) || nam < 1000 || nam > 9999) {
          setError('Tháng hoặc năm không hợp lệ.');
          return;
        }
        setStatus('executing');
        await financeService.datNganSach({
          danhMuc: fields.danhMuc || 'an_uong',
          soTienToiDa: amount,
          thang,
          nam,
        });
      }

      setStatus('executed');
      hienToast('success', 'Đã thực hiện thao tác!');
    } catch (err) {
      setStatus('pending');
      setError(err?.response?.data?.message || err?.message || 'Chưa thực thi được thao tác. Hãy kiểm tra lại thông tin.');
    }
  }

  const destination = action.tool === 'create_deadline'
    ? { to: '/deadline', text: 'Xem Deadline' }
    : action.tool === 'create_class_session'
      ? { to: '/lich-hoc', text: 'Xem Thời khóa biểu' }
      : { to: '/tai-chinh', text: action.tool === 'set_budget' ? 'Xem Ngân sách' : 'Xem Tài chính' };

  if (status === 'cancelled') {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
        {tr('Đã hủy đề xuất thao tác:')} {tr(action.label)}
      </div>
    );
  }

  if (status === 'executed') {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{tr('Đã thực thi thành công · {0}', tr(action.label))}</span>
        </div>
        <Link
          to={destination.to}
          onClick={() => onNavigate?.()}
          className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
        >
          <span>{tr(destination.text)}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const busy = status === 'executing';

  return (
    <form
      onSubmit={handleExecute}
      className="mt-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700/80 bg-white dark:bg-slate-800 p-3 shadow-sm space-y-2.5 text-slate-800 dark:text-slate-100"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Bot className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{tr(action.label)}</span>
        </div>
      </div>

      {action.tool === 'create_transaction' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Loại')}
            <select value={fields.loai || 'chi'} disabled={busy} onChange={(e) => updateField('loai', e.target.value)} className={inputCls + ' mt-1'}>
              <option value="chi">{tr('Chi tiêu')}</option>
              <option value="thu">{tr('Thu nhập')}</option>
            </select>
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Số tiền (đ)')}
            <input type="number" min={1} max={1000000000000} required disabled={busy} value={fields.soTien} onChange={(e) => updateField('soTien', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Danh mục')}
            <select value={fields.danhMuc || ''} disabled={busy} onChange={(e) => updateField('danhMuc', e.target.value)} className={inputCls + ' mt-1'}>
              {categoryOptions.map((c) => (
                <option key={c.ma} value={c.ma}>{categoryDisplayName(c)}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Ngày giao dịch')}
            <input type="date" required disabled={busy} value={fields.ngayGiaoDich || ''} onChange={(e) => updateField('ngayGiaoDich', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="col-span-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Mô tả')}
            <input type="text" maxLength={500} disabled={busy} value={fields.moTa || ''} onChange={(e) => updateField('moTa', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
        </div>
      )}

      {action.tool === 'create_deadline' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Tên công việc')}
            <input type="text" required maxLength={200} disabled={busy} value={fields.tieuDe || ''} onChange={(e) => updateField('tieuDe', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Ngày hạn chót')}
            <input type="date" required disabled={busy} value={fields.dueDate || ''} onChange={(e) => updateField('dueDate', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Giờ (tùy chọn)')}
            <input type="time" disabled={busy} value={fields.dueTime || ''} onChange={(e) => updateField('dueTime', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="col-span-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Độ ưu tiên')}
            <select value={fields.doUuTien || 'binh_thuong'} disabled={busy} onChange={(e) => updateField('doUuTien', e.target.value)} className={inputCls + ' mt-1'}>
              <option value="thap">{tr('Thấp')}</option>
              <option value="binh_thuong">{tr('Bình thường')}</option>
              <option value="cao">{tr('Khẩn cấp')}</option>
            </select>
          </label>
        </div>
      )}

      {action.tool === 'create_class_session' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Tên môn học')}
            <input type="text" required maxLength={200} disabled={busy} value={fields.tenMon || ''} onChange={(e) => updateField('tenMon', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Thứ')}
            <select value={fields.thu || 2} disabled={busy} onChange={(e) => updateField('thu', e.target.value)} className={inputCls + ' mt-1'}>
              {[2, 3, 4, 5, 6, 7, 8].map((day) => (
                <option key={day} value={day}>{day === 8 ? tr('Chủ nhật') : tr('Thứ {0}', day)}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Phòng học')}
            <input type="text" maxLength={50} disabled={busy} value={fields.phongHoc || ''} onChange={(e) => updateField('phongHoc', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Bắt đầu')}
            <input type="time" required disabled={busy} value={fields.gioBatDau || ''} onChange={(e) => updateField('gioBatDau', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Kết thúc')}
            <input type="time" required disabled={busy} value={fields.gioKetThuc || ''} onChange={(e) => updateField('gioKetThuc', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
        </div>
      )}

      {action.tool === 'set_budget' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Danh mục')}
            <select value={fields.danhMuc || ''} disabled={busy} onChange={(e) => updateField('danhMuc', e.target.value)} className={inputCls + ' mt-1'}>
              {categoryOptions.map((c) => (
                <option key={c.ma} value={c.ma}>{categoryDisplayName(c)}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Hạn mức (đ)')}
            <input type="number" min={1} max={1000000000000} required disabled={busy} value={fields.soTienToiDa} onChange={(e) => updateField('soTienToiDa', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Tháng')}
            <input type="number" min={1} max={12} required disabled={busy} value={fields.thang || ''} onChange={(e) => updateField('thang', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {tr('Năm')}
            <input type="number" min={1000} max={9999} required disabled={busy} value={fields.nam || ''} onChange={(e) => updateField('nam', e.target.value)} className={inputCls + ' mt-1'} />
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-300">
          {tr(error)}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => setStatus('cancelled')}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {tr('Hủy')}
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {busy ? tr('Đang lưu…') : tr('Xác nhận thực thi')}
        </button>
      </div>
    </form>
  );
}
