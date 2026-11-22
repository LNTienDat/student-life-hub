import { useEffect, useState } from 'react';
import { CalendarSync } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import timetableService from '../services/timetableService';
import academicService from '../services/academicService';
import { useToast } from '../context/ToastContext';

function normalizeKey(ten, hocKy) {
  return `${String(ten || '').trim().normalize('NFC').toLocaleLowerCase('vi')}::${String(hocKy || '').trim().normalize('NFC').toLocaleLowerCase('vi')}`;
}

export default function SyncSubjectsFromTimetableModal({
  open,
  onClose,
  semester = '',
  currentSemester = '',
  existingSubjects = [],
  onImported,
}) {
  useLanguage();
  const { hienToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const fallbackSem = (semester || currentSemester || '').trim();

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await timetableService.layThoiKhoaBieu(semester);
        if (!active) return;
        const rawList = res.data?.lichLap || res.data?.thoiKhoaBieu || [];
        const existingKeys = new Set(existingSubjects.map((m) => normalizeKey(m.ten, m.hocKy)));
        const seen = new Set();
        const unique = [];
        for (const row of rawList) {
          const ten = String(row.tenMon || '').trim();
          const hocKy = String(row.hocKy || fallbackSem || '').trim();
          if (!ten) continue;
          const k = normalizeKey(ten, hocKy);
          if (seen.has(k)) continue;
          seen.add(k);
          const alreadyExists = existingKeys.has(k);
          unique.push({
            key: k,
            ten,
            hocKy,
            tinChi: 3,
            alreadyExists,
            selected: !alreadyExists,
          });
        }
        setItems(unique);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Chưa tải được danh sách môn từ Lịch học.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [open, semester, fallbackSem, existingSubjects]);

  const selected = items.filter((item) => item.selected);
  const invalid = selected.some((item) => !item.ten.trim() || !item.hocKy.trim() || !Number.isInteger(Number(item.tinChi)) || Number(item.tinChi) < 1 || Number(item.tinChi) > 20);

  async function handleImport() {
    if (saving || !selected.length || invalid) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await academicService.nhapHangLoat(selected.map((item) => ({
        ten: item.ten.trim(),
        tinChi: Number(item.tinChi),
        hocKy: item.hocKy.trim(),
        diems: [],
      })));
      hienToast('success', `Đã thêm ${data.createdSubjects} môn học từ Lịch học!`);
      onImported?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa đồng bộ được môn học.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalDialog open={open} onClose={onClose} busy={saving} wide title="Lấy môn từ Lịch học">
      <div className="space-y-4 text-sm">
        <p className="text-slate-600 dark:text-slate-300">
          {tr("Kéo nhanh tên các môn đã có trong Thời khóa biểu sang Học tập mà không cần gõ tay từng môn. Bạn có thể chỉnh số tín chỉ trước khi lưu.")}
        </p>

        {loading && <p className="py-6 text-center text-slate-500">{tr("Đang tải môn học từ Lịch học…")}</p>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{tr(error)}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
            {tr("Chưa có buổi học nào trong Lịch học để đồng bộ.")}
          </p>
        )}

        {!loading && items.length > 0 && (
          <div className="max-h-[50dvh] space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.key}
                className={`flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2.5 ${item.alreadyExists ? 'border-slate-200/70 bg-slate-50/60 opacity-65 dark:border-slate-800 dark:bg-slate-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50'}`}
              >
                <input
                  type="checkbox"
                  disabled={item.alreadyExists || saving}
                  checked={item.selected}
                  onChange={(e) => setItems((prev) => prev.map((it) => (it.key === item.key ? { ...it, selected: e.target.checked } : it)))}
                  aria-label={tr("Chọn môn ") + item.ten}
                  className="h-4 w-4 accent-indigo-600 rounded"
                />
                <div className="min-w-[160px] flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{item.ten}</p>
                  {item.alreadyExists && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-300">{tr("Đã có trong Học tập")}</span>}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {tr("Tín chỉ")}
                  <input
                    type="number"
                    min="1"
                    max="20"
                    disabled={item.alreadyExists || saving}
                    value={item.tinChi}
                    onChange={(e) => setItems((prev) => prev.map((it) => (it.key === item.key ? { ...it, tinChi: parseInt(e.target.value, 10) || '' } : it)))}
                    className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <input
                  type="text"
                  disabled={item.alreadyExists || saving}
                  value={item.hocKy}
                  onChange={(e) => setItems((prev) => prev.map((it) => (it.key === item.key ? { ...it, hocKy: e.target.value } : it)))}
                  placeholder="HK1 2025-2026"
                  className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {selected.length > 0 && invalid && (
            <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
              {tr("Nhập đủ Học kỳ và Tín chỉ (1–20) cho các môn đang chọn.")}
            </p>
          )}
          <div className="flex justify-end gap-2.5">
            <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-xl px-4 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
              {tr("Đóng")}
            </button>
            <button
              type="button"
              disabled={saving || loading || !selected.length || invalid}
              onClick={handleImport}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CalendarSync className="h-4 w-4 shrink-0" />
              {saving ? tr('Đang lưu…') : tr("Thêm {0} môn đã chọn", selected.length)}
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
