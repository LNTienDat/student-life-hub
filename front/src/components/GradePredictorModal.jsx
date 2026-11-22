import { useState } from 'react';
import { Calculator } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import academicService from '../services/academicService';
import { calcSubjectAverage10, toGpa4, toLetterGrade } from '../utils/gradeScale';

const TARGET_PRESETS = [
  { label: 'Qua môn (D · 4.0)', score10: '4.0' },
  { label: 'Trung bình (C · 5.5)', score10: '5.5' },
  { label: 'Khá (B · 7.0)', score10: '7.0' },
  { label: 'Giỏi (A · 8.5)', score10: '8.5' },
];

export default function GradePredictorModal({ mon, open, onClose, scaleId = '8_level' }) {
  useLanguage();
  const { diem10, totalWeight } = calcSubjectAverage10(mon?.diems || []);
  const remainingWeight = Math.max(0, Math.round((100 - totalWeight) * 100) / 100);

  const [target, setTarget] = useState('7.0');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function calculate(goalValue = target) {
    if (!mon?.id || remainingWeight <= 0) return;
    const mucTieu = Number(String(goalValue).replace(',', '.'));
    if (!Number.isFinite(mucTieu) || mucTieu < 0 || mucTieu > 10) {
      setError('Nhập điểm mục tiêu từ 0 đến 10.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await academicService.duDoanDiem(mon.id, {
        mucTieu,
        trongSoConLai: remainingWeight,
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa tính được điểm dự đoán.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalDialog open={open} onClose={onClose} title="Dự đoán điểm cần đạt cuối kỳ">
      {mon && (
        <div className="space-y-4 text-sm">
          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900/50">
            <p className="font-semibold text-slate-900 dark:text-white">{mon.ten}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr("Đã có")} <strong>{totalWeight}%</strong> {tr("trọng số")}
              {diem10 !== null && <> · {tr("TB tạm tính:")} <strong>{diem10.toFixed(2)}/10</strong></>}
              {' · '}{tr("Còn lại:")} <strong>{remainingWeight}%</strong>
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">{tr("Chọn nhanh mục tiêu tổng kết môn")}</span>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_PRESETS.map((p) => (
                <button
                  key={p.score10}
                  type="button"
                  onClick={() => { setTarget(p.score10); calculate(p.score10); }}
                  className={`min-h-10 rounded-xl border px-3 py-1.5 text-left text-xs font-medium transition-colors ${target === p.score10 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'}`}
                >
                  {tr(p.label)}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); calculate(target); }}
            className="flex items-end gap-2"
          >
            <label className="flex-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              {tr("Hoặc nhập điểm mục tiêu (thang 10)")}
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
              />
            </label>
            <button
              type="submit"
              disabled={busy || remainingWeight <= 0}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />{tr("Tính")}
            </button>
          </form>

          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">{tr(error)}</p>}

          {result && (
            <div className={`rounded-xl border p-4 ${result.khaThi ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100'}`}>
              {Number(result.diemCanDat) <= 0 ? (
                <p className="font-medium">
                  {tr("Bạn đã tích lũy đủ {0} điểm rồi — mục tiêu {1}/10 gần như đã chắc chắn đạt!", result.tongDaDat, result.mucTieu)}
                </p>
              ) : result.khaThi ? (
                <>
                  <p className="text-xs uppercase tracking-wide opacity-80">{tr("Điểm tối thiểu cần đạt ở {0}% còn lại", remainingWeight)}</p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {result.diemCanDat} / 10
                    <span className="ml-2 text-sm font-semibold opacity-80">
                      ({toLetterGrade(Number(result.diemCanDat), scaleId)} · {toGpa4(Number(result.diemCanDat), scaleId).toFixed(1)}/4)
                    </span>
                  </p>
                </>
              ) : (
                <p className="font-medium">
                  {tr("Để đạt {0}/10, bạn cần tới {1}/10 ở phần còn lại (vượt quá 10 điểm nên không khả thi). Hãy chọn mục tiêu thực tế hơn.", result.mucTieu, result.diemCanDat)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </ModalDialog>
  );
}
