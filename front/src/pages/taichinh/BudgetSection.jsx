import MoneyInput from '../../components/MoneyInput';
import { useState, useRef } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { TEN_DANH_MUC, DANH_MUC_CHI } from '../../constants';
import { dinhDangTien } from '../../utils/formatters';

function BudgetSection({ nganSachs = [], thongKe, onQuickTransaction, onSaveBudget }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState('an_uong');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  function selectCategory(value) {
    setCategory(value);
    setAmount(nganSachs.find((item) => item.danhMuc === value)?.soTienToiDa ?? '');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await onSaveBudget({ danhMuc: category, soTienToiDa: Number(amount) });
      setEditing(false);
    } catch (failure) {
      setError(failure.response?.data?.message || 'Chưa lưu được ngân sách. Vui lòng thử lại.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-amber-500" />
          Ngân sách tháng này
        </h2>
        <button type="button" disabled={saving} aria-expanded={editing} onClick={() => { selectCategory(category); setEditing(!editing); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-ink-700 dark:border-slate-600 dark:text-ink-200">
          {editing ? 'Đóng' : 'Đặt ngân sách'}
        </button>
      </div>

      {editing && (
        <form onSubmit={submit} className="mb-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
          <fieldset disabled={saving} className="space-y-3">
            <label className="block text-sm text-slate-700 dark:text-slate-200">Danh mục chi tiêu
              <select value={category} onChange={(event) => selectCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
                {DANH_MUC_CHI.map((item) => <option key={item} value={item}>{TEN_DANH_MUC[item]}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-200">Hạn mức tháng này (đồng)
              <MoneyInput required value={amount} onValueChange={setAmount} placeholder="Ví dụ: 1 500 000" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nếu danh mục đã có ngân sách, số tiền này sẽ thay hạn mức hiện tại.</p>
            {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            <button type="submit" className="rounded-lg bg-ink-600 px-4 py-2 text-sm font-medium text-white">{saving ? 'Đang lưu…' : 'Lưu ngân sách'}</button>
          </fieldset>
        </form>
      )}
      <div className="space-y-5 flex-1">
        {nganSachs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Đặt hạn mức cho từng danh mục để theo dõi chi tiêu trong tháng.
          </div>
        ) : (
          nganSachs.map((ns) => {
            const daChi = ns.daChi ?? thongKe?.theoDanhMuc?.[ns.danhMuc] ?? 0;
            const limit = ns.soTienToiDa;
            const phanTram = limit > 0 ? (daChi / limit) * 100 : 0;
            const vuotNgay = phanTram > 100;
            const canhBao = phanTram >= 80 && !vuotNgay;

            return (
              <button
                type="button"
                key={ns.danhMuc}
                className="group block w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-500"
                aria-label={`Ghi khoản chi ${TEN_DANH_MUC[ns.danhMuc] || ns.danhMuc}`}
                onClick={() => onQuickTransaction && onQuickTransaction(ns.danhMuc)}
              >
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-ink-600 dark:group-hover:text-ink-300 transition-colors">
                    {TEN_DANH_MUC[ns.danhMuc] || ns.danhMuc}
                  </span>
                  <span
                    className={`font-medium ${
                      vuotNgay
                        ? 'text-rose-600 dark:text-rose-400'
                        : canhBao
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {dinhDangTien(daChi)} / {dinhDangTien(limit)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      vuotNgay ? 'bg-rose-500' : canhBao ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(phanTram, 100)}%` }}
                  ></div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default BudgetSection;
