import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import { fetchVisionOcrStatus, scanTranscriptWithAI } from '../services/visionOcr';
import academicService from '../services/academicService';
import { convertInputTo10, LETTER_GRADE_OPTIONS } from '../utils/gradeScale';
import { useToast } from '../context/ToastContext';

function normalizeKey(ten, hocKy) {
  return `${String(ten || '').trim().normalize('NFC').toLocaleLowerCase('vi')}::${String(hocKy || '').trim().normalize('NFC').toLocaleLowerCase('vi')}`;
}

export default function TranscriptImportModal({
  open,
  onClose,
  defaultSemester = '',
  scaleId = '8_level',
  existingSubjects = [],
  onImported,
}) {
  useLanguage();
  const { hienToast } = useToast();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const abortRef = useRef(null);

  const [aiAvailable, setAiAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [rows, setRows] = useState([]);
  const [fallbackSemester, setFallbackSemester] = useState(defaultSemester);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchVisionOcrStatus()
      .then((res) => { if (active) setAiAvailable(Boolean(res?.aiSanSang)); })
      .catch(() => { if (active) setAiAvailable(false); });
    return () => { active = false; };
  }, [open]);

  function resetAndClose() {
    if (saving) return;
    abortRef.current?.abort();
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setBusy(false);
    setError('');
    setImagePreview('');
    setRows([]);
    onClose?.();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setBusy(true);
    setError('');
    try {
      const result = await scanTranscriptWithAI(file, { signal: controller.signal });
      const sem = (fallbackSemester || defaultSemester || '').trim();
      const prepared = (result.rows || []).map((r) => ({
        ...r,
        hocKy: r.hocKy || sem,
      }));
      setRows(prepared);
      if (!prepared.length) {
        setError('AI Vision chưa thấy dòng môn học/điểm nào rõ ràng trong ảnh này. Bạn hãy thử ảnh sắc nét hơn.');
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err?.response?.data?.message || err?.message || 'Chưa đọc được ảnh bảng điểm.');
      }
    } finally {
      setBusy(false);
    }
  }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addGradeColumn(rowId) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const usedWeight = (r.diems || []).reduce((sum, g) => sum + Number(g.trongSo || 0), 0);
      const remain = Math.max(10, Math.round((100 - usedWeight) * 100) / 100);
      return {
        ...r,
        diems: [
          ...(r.diems || []),
          {
            id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`,
            loaiDanhGia: usedWeight === 0 ? 'Tổng kết' : 'Cuối kỳ',
            rawValue: '',
            inputScale: '10',
            diem: NaN,
            trongSo: remain > 0 ? remain : 50,
          },
        ],
      };
    }));
  }

  function updateGrade(rowId, gradeId, patch) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        diems: (r.diems || []).map((g) => {
          if (g.id !== gradeId) return g;
          const next = { ...g, ...patch };
          next.diem = convertInputTo10(next.rawValue, next.inputScale, scaleId);
          return next;
        }),
      };
    }));
  }

  function removeGrade(rowId, gradeId) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, diems: (r.diems || []).filter((g) => g.id !== gradeId) } : r)));
  }

  const existingSet = new Set(existingSubjects.map((m) => normalizeKey(m.ten, m.hocKy)));
  const selectedRows = rows.filter((r) => r.selected);

  const hasInvalidSelected = selectedRows.some((r) => {
    const credits = Number(r.tinChi);
    if (!r.ten?.trim() || !(r.hocKy || fallbackSemester)?.trim() || !Number.isInteger(credits) || credits < 1 || credits > 20) {
      return true;
    }
    let totalW = 0;
    for (const g of (r.diems || [])) {
      const converted = convertInputTo10(g.rawValue, g.inputScale, scaleId);
      const w = Number(g.trongSo);
      if (!g.loaiDanhGia?.trim() || !Number.isFinite(converted) || !Number.isFinite(w) || w <= 0 || w > 100) return true;
      totalW += w;
    }
    return totalW > 100 + 1e-8;
  });

  async function handleSave() {
    if (saving || busy || !selectedRows.length || hasInvalidSelected) return;
    setSaving(true);
    setError('');
    try {
      const payload = selectedRows.map((r) => ({
        ten: r.ten.trim(),
        tinChi: Number(r.tinChi),
        hocKy: (r.hocKy || fallbackSemester).trim(),
        diems: (r.diems || []).map((g) => ({
          loaiDanhGia: g.loaiDanhGia.trim(),
          diem: convertInputTo10(g.rawValue, g.inputScale, scaleId),
          trongSo: Number(g.trongSo),
        })),
      }));
      const { data } = await academicService.nhapHangLoat(payload);
      hienToast('success', `Đã lưu ${data.createdSubjects} môn mới, cập nhật ${data.updatedSubjects} môn và thêm ${data.createdGrades} cột điểm!`);
      onImported?.();
      setSaving(false);
      abortRef.current?.abort();
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview('');
      setRows([]);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa lưu được bảng điểm. Hãy kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalDialog open={open} onClose={resetAndClose} busy={saving} wide title="Quét bảng điểm từ ảnh (AI Vision)">
      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs leading-relaxed text-indigo-900 dark:border-indigo-800/70 dark:bg-indigo-950/30 dark:text-indigo-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {tr("Chụp màn hình bảng điểm từ cổng đào tạo (giữa kỳ hoặc các kỳ đã học). AI tự nhận diện tên môn, tín chỉ, điểm thang 10 / thang 4 / điểm chữ để bạn kiểm tra trước khi lưu.")}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {tr("Học kỳ mặc định (nếu ảnh không ghi)")}
            <input
              type="text"
              value={fallbackSemester}
              onChange={(e) => setFallbackSemester(e.target.value)}
              placeholder="VD: HK1 2025-2026"
              disabled={busy || saving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            />
          </label>
          <button
            type="button"
            disabled={busy || saving || !aiAvailable}
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
          >
            <ImagePlus className="h-4 w-4 shrink-0" />{tr("Chọn ảnh")}
          </button>
          <button
            type="button"
            disabled={busy || saving || !aiAvailable}
            onClick={() => cameraRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white whitespace-nowrap"
          >
            <Camera className="h-4 w-4 shrink-0" />{tr("Chụp ảnh")}
          </button>
        </div>

        {!aiAvailable && (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {tr("AI Vision chưa được bật trên máy chủ. Bạn vẫn có thể thêm môn từ Lịch học hoặc nhập từ Excel/CSV.")}
          </p>
        )}

        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="sr-only" />
        <input ref={cameraRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={handleFileChange} className="sr-only" />

        {busy && (
          <div role="status" className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-center text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-200">
            {tr("Đang phân tích bảng điểm bằng AI Vision… Vui lòng đợi vài giây.")}
          </div>
        )}

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{tr(error)}</p>}

        {imagePreview && (
          <details className="text-xs">
            <summary className="cursor-pointer py-1 font-medium text-indigo-600 dark:text-indigo-300">{tr("Xem ảnh bảng điểm đã chọn")}</summary>
            <img src={imagePreview} alt={tr("Ảnh bảng điểm")} className="mt-2 max-h-64 rounded-xl border object-contain" />
          </details>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>{tr("Đã nhận diện")} <strong>{rows.length}</strong> {tr("môn · Đang chọn")} <strong>{selectedRows.length}</strong> {tr("môn")}</span>
              <span>{tr("Môn trùng tên trong cùng kỳ sẽ tự bổ sung thêm cột điểm mới.")}</span>
            </div>

            <div className="max-h-[45dvh] space-y-3 overflow-y-auto pr-1">
              {rows.map((row) => {
                const effSemester = row.hocKy || fallbackSemester;
                const isExisting = existingSet.has(normalizeKey(row.ten, effSemester));
                return (
                  <div key={row.id} className={`rounded-xl border p-3 space-y-2.5 ${row.selected ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40' : 'border-slate-200/60 bg-slate-50/50 opacity-60 dark:border-slate-800'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                        aria-label={tr("Chọn môn ") + row.ten}
                        className="h-4 w-4 accent-indigo-600 rounded"
                      />
                      <input
                        type="text"
                        value={row.ten}
                        onChange={(e) => updateRow(row.id, { ten: e.target.value })}
                        placeholder={tr("Tên môn học")}
                        className="min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={row.tinChi}
                        onChange={(e) => updateRow(row.id, { tinChi: parseInt(e.target.value, 10) || '' })}
                        title={row.tinChiMacDinh ? tr('Ảnh không ghi tín chỉ — tạm đặt 3, hãy chỉnh lại nếu khác') : tr('Số tín chỉ')}
                        className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="text"
                        value={row.hocKy}
                        onChange={(e) => updateRow(row.id, { hocKy: e.target.value })}
                        placeholder={fallbackSemester || 'HK1 2025-2026'}
                        className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isExisting ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>
                        {isExisting ? tr('Bổ sung điểm') : tr('Môn mới')}
                      </span>
                      <button type="button" onClick={() => removeRow(row.id)} aria-label={tr("Bỏ môn này")} className="p-1.5 text-slate-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pl-6">
                      {(row.diems || []).map((g) => {
                        const converted = convertInputTo10(g.rawValue, g.inputScale, scaleId);
                        const badValue = !Number.isFinite(converted);
                        return (
                          <div key={g.id} className="flex flex-wrap items-center gap-1.5 text-xs">
                            <input
                              type="text"
                              value={g.loaiDanhGia}
                              onChange={(e) => updateGrade(row.id, g.id, { loaiDanhGia: e.target.value })}
                              placeholder={tr("Loại điểm")}
                              className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <select
                              value={g.inputScale}
                              onChange={(e) => updateGrade(row.id, g.id, { inputScale: e.target.value })}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                              <option value="10">{tr("Hệ 10")}</option>
                              <option value="4">{tr("Hệ 4")}</option>
                              <option value="letter">{tr("Chữ")}</option>
                            </select>
                            {g.inputScale === 'letter' ? (
                              <select
                                value={String(g.rawValue || '').toUpperCase()}
                                onChange={(e) => updateGrade(row.id, g.id, { rawValue: e.target.value })}
                                className={`w-20 rounded-lg border px-2 py-1 dark:bg-slate-800 dark:text-white ${badValue ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                              >
                                <option value="">--</option>
                                {LETTER_GRADE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={g.rawValue}
                                onChange={(e) => updateGrade(row.id, g.id, { rawValue: e.target.value })}
                                placeholder={g.inputScale === '4' ? '0–4' : '0–10'}
                                className={`w-20 rounded-lg border px-2 py-1 dark:bg-slate-800 dark:text-white ${badValue ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                              />
                            )}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={g.trongSo}
                                onChange={(e) => updateGrade(row.id, g.id, { trongSo: parseFloat(e.target.value) || '' })}
                                className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                              <span className="text-slate-400">%</span>
                            </div>
                            {!badValue && g.inputScale !== '10' && (
                              <span className="text-[11px] text-indigo-600 dark:text-indigo-300">→ {converted}/10</span>
                            )}
                            <button type="button" onClick={() => removeGrade(row.id, g.id)} aria-label={tr("Xóa cột điểm")} className="p-1 text-slate-400 hover:text-rose-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addGradeColumn(row.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        <Plus className="h-3.5 w-3.5" />{tr("Thêm cột điểm")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasInvalidSelected && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
                {tr("Kiểm tra các môn đang chọn: tên môn, học kỳ, tín chỉ (1–20), giá trị điểm hợp lệ và tổng trọng số không vượt 100%.")}
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" disabled={saving} onClick={resetAndClose} className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                {tr("Hủy bỏ")}
              </button>
              <button
                type="button"
                disabled={saving || busy || !selectedRows.length || hasInvalidSelected}
                onClick={handleSave}
                className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? tr('Đang lưu…') : tr("Lưu {0} môn học", selectedRows.length)}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
