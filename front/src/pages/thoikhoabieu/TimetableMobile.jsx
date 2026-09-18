import { Clock, MapPin, User, Edit2, Trash2 } from 'lucide-react';
import { CAC_THU, mauChoMon } from './timetableUtils';

function TimetableMobile({ buoiTheoThu = {}, onSua, onXoa }) {
  return (
    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
      {CAC_THU.map((t) => {
        const buois = buoiTheoThu[t.gia] || [];
        if (buois.length === 0) return null;
        return (
          <div key={t.gia} className="p-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                {t.tat}
              </span>
              {t.ten}
            </h3>
            <div className="space-y-3">
              {buois.map((bh) => (
                <div key={bh.id} className={`relative rounded-xl p-4 border ${mauChoMon(bh.tenMon)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-base leading-tight pr-4">{bh.tenMon}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSua(bh)}
                        aria-label={`Sửa buổi học ${bh.tenMon}`}
                        className="p-1.5 bg-white/50 dark:bg-black/20 rounded shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onXoa(bh)}
                        aria-label={`Xóa buổi học ${bh.tenMon}`}
                        className="p-1.5 bg-white/50 dark:bg-black/20 rounded shadow-sm text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm font-medium opacity-90 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {bh.gioBatDau} - {bh.gioKetThuc}
                    </div>
                    {bh.phongHoc && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {bh.phongHoc}
                      </div>
                    )}
                    {bh.giangVien && (
                      <div className="flex items-center gap-1.5 col-span-2 truncate">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bh.giangVien}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TimetableMobile;
