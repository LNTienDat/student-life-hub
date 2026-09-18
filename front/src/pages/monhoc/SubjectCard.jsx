import { Edit2, Trash2, Plus } from 'lucide-react';

function tinhDiemMon(diems) {
  if (!diems || diems.length === 0) return null;
  let tongDiem = 0;
  let tongTrongSo = 0;
  diems.forEach((d) => {
    tongDiem += d.diem * d.trongSo;
    tongTrongSo += d.trongSo;
  });
  return tongTrongSo > 0 ? (tongDiem / tongTrongSo).toFixed(2) : null;
}

function SubjectCard({
  mon,
  monThemDiemId,
  dangSuaDiemId,
  loaiDanhGia,
  diemSo,
  trongSo,
  onOpenAddGrade,
  onOpenEditGrade,
  onCloseGradeForm,
  onLoaiDanhGiaChange,
  onDiemSoChange,
  onTrongSoChange,
  onSubmitGrade,
  onDeleteGrade,
  onEditSubject,
  onDeleteSubject,
}) {
  const diemMon = tinhDiemMon(mon.diems);
  const quaMon = diemMon && parseFloat(diemMon) >= 5;
  const isEditingGradeForThisSubject = monThemDiemId === mon.id;

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Header thẻ môn học */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3
            className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight line-clamp-2"
            title={mon.ten}
          >
            {mon.ten}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium">
              {mon.tinChi} TC
            </span>
            <span>•</span>
            <span>{mon.hocKy}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          {diemMon ? (
            <div
              className={`flex flex-col items-end ${
                quaMon ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <span className="font-display text-2xl font-bold leading-none">{diemMon}</span>
              <span className="text-[11px] font-semibold mt-0.5">{quaMon ? 'Đạt' : 'Chưa đạt'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-end text-slate-400">
              <span className="font-display text-2xl font-bold leading-none">--</span>
              <span className="text-[11px] font-medium mt-0.5">Chưa có</span>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách các cột điểm */}
      <div className="flex-1">
        {mon.diems && mon.diems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {mon.diems.map((d) => (
              <span
                key={d.id}
                className="group text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1.5 transition-all hover:border-ink-300 dark:hover:border-slate-600"
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">{d.loaiDanhGia}</span>
                <span className="text-slate-400">|</span>
                <span className="font-bold text-slate-900 dark:text-white">{d.diem}</span>
                <span className="text-slate-400 text-[10px]">({d.trongSo}%)</span>
                <span className="flex items-center gap-0.5 ml-1 border-l border-slate-200 dark:border-slate-700 pl-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditGrade(mon.id, d)}
                    className="text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 p-0.5 rounded transition-colors"
                    title="Sửa điểm này"
                    aria-label={`Sửa điểm ${d.loaiDanhGia} môn ${mon.ten}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGrade(mon, d)}
                    className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                    title="Xóa điểm này"
                    aria-label={`Xóa điểm ${d.loaiDanhGia} môn ${mon.ten}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Thêm điểm hoặc Form nhập điểm */}
      <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-auto">
        {isEditingGradeForThisSubject ? (
          <form
            onSubmit={(e) => onSubmitGrade(e, mon.id)}
            className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {dangSuaDiemId ? (
                  <span>
                    ✏️ Sửa điểm: <strong className="text-ink-600 dark:text-ink-400 font-bold">{loaiDanhGia}</strong>
                  </span>
                ) : (
                  '+ Thêm cột điểm mới'
                )}
              </span>
            </div>
            {!dangSuaDiemId && (
              <input
                type="text"
                placeholder="Loại điểm (VD: Giữa kỳ)"
                aria-label="Loại đánh giá"
                value={loaiDanhGia}
                onChange={(e) => onLoaiDanhGiaChange(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                required
              />
            )}
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Điểm"
                aria-label="Điểm số"
                value={diemSo}
                onChange={(e) => onDiemSoChange(e.target.value)}
                min="0"
                max="10"
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                required
              />
              <input
                type="number"
                placeholder="Trọng số (%)"
                aria-label="Trọng số phần trăm"
                value={trongSo}
                onChange={(e) => onTrongSoChange(e.target.value)}
                min="1"
                max="100"
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                required
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={onCloseGradeForm}
                className="flex-1 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 text-white bg-ink-600 hover:bg-ink-700 dark:bg-ink-500 dark:hover:bg-ink-400 py-1.5 rounded-lg font-medium text-xs transition-colors"
              >
                {dangSuaDiemId ? 'Cập nhật điểm' : 'Lưu điểm'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => onOpenAddGrade(mon.id)}
              aria-label={`Thêm điểm cho môn ${mon.ten}`}
              className="text-ink-600 dark:text-ink-300 text-xs font-medium hover:text-ink-800 dark:hover:text-ink-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm điểm
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => onEditSubject(mon)}
                className="text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
                title="Sửa môn học"
                aria-label={`Sửa môn học ${mon.ten}`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteSubject(mon)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Xóa môn học"
                aria-label={`Xóa môn học ${mon.ten}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectCard;
