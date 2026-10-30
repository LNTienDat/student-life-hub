import CloseButton from '../../components/CloseButton';
import useSessionDraft from '../../hooks/useSessionDraft';
import { validDong, moneyError } from '../../utils/money';
import ConfirmModal from '../../components/ConfirmModal';
import financeService from '../../services/financeService';
import { Trash2 } from 'lucide-react';
import MoneyInput from '../../components/MoneyInput';
import { useState, useRef, useEffect } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useFinanceCategories } from '../../context/FinanceCategoryContext';
import CategorySelect from '../../components/CategorySelect';
import { dinhDangTien } from '../../utils/formatters';

function BudgetSection({ nganSachs = [], thongKe, onQuickTransaction, onSaveBudget, periodLabel, onBusyChange, onDirtyChange, disabled = false }) {
  const { label, categories, loaded } = useFinanceCategories();
  const [editing, setEditing] = useSessionDraft('budget-open:'+periodLabel, false);
  const [drafts, setDrafts] = useSessionDraft('budget-drafts:'+periodLabel, {});
  const [confirm, setConfirm] = useState(null);
  const [category, setCategory] = useSessionDraft('budget-category:'+periodLabel, 'an_uong');
  const [amount, setAmount] = useSessionDraft('budget-amount:'+periodLabel, '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const originalAmount = String(nganSachs.find(item => item.danhMuc === category)?.soTienToiDa ?? '');
  useEffect(() => { onDirtyChange?.(editing && String(amount) !== originalAmount); }, [editing, amount, originalAmount, onDirtyChange]);

  function selectCategory(value) {
    const saved={...drafts,[category]:amount};
    setDrafts(saved);
    setCategory(value);
    setAmount(saved[value] ?? nganSachs.find((item) => item.danhMuc === value)?.soTienToiDa ?? '');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if(!validDong(amount)){setError(moneyError);return;}
    lock.current = true;
    setSaving(true); onBusyChange?.(true);
    setError('');
    try {
      await onSaveBudget({ danhMuc: category, soTienToiDa: Number(amount) });
      setDrafts(current=>{const next={...current};delete next[category];return next;});
      setAmount(null);
      setEditing(false);
    } catch (failure) {
      setError(failure.response?.data?.message || 'Chưa lưu được ngân sách. Vui lòng thử lại.');
    } finally {
      lock.current = false;
      setSaving(false); onBusyChange?.(false);
    }
  }

  return (
    <><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-amber-500" />
          Ngân sách {periodLabel ? 'tháng ' + periodLabel : 'tháng này'}
        </h2>
        {editing ? <CloseButton onClick={()=>setEditing(false)} disabled={saving||disabled} label="Đóng ngân sách" aria-expanded="true"/> : <button type="button" disabled={saving || disabled} aria-expanded={editing} onClick={() => { if(!editing)setAmount(drafts[category] ?? nganSachs.find(item=>item.danhMuc===category)?.soTienToiDa ?? '');setEditing(!editing); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-ink-700 dark:border-slate-600 dark:text-ink-200">
          Đặt ngân sách
        </button>}
      </div>

      {editing && (
        <form onSubmit={submit} className="mb-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
          <fieldset disabled={saving || disabled} className="space-y-3">
            <label className="block text-sm text-slate-700 dark:text-slate-200">Danh mục chi tiêu
              <CategorySelect loai="chi" value={category} onChange={selectCategory} label="Danh mục chi tiêu" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"/>
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-200">Hạn mức tháng đang chọn (đồng)
              <MoneyInput required value={amount} onValueChange={value=>{setAmount(value);setDrafts(current=>({...current,[category]:value}));}} placeholder="Ví dụ: 1 500 000" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
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
            const archived = categories.find(item => item.ma === ns.danhMuc && item.loai === 'chi')?.daAn === true;
            const phanTram = limit > 0 ? (daChi / limit) * 100 : 0;
            const vuotNgay = phanTram > 100;
            const canhBao = phanTram >= 80 && !vuotNgay;

            return (
              <div key={ns.danhMuc}><div className="flex min-w-0 items-start gap-2"><button
                type="button"
                disabled={saving || disabled || !loaded || archived}
                key={ns.danhMuc}
                className="group block w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-500 disabled:cursor-default"
                aria-label={`Ghi khoản chi ${label(ns.danhMuc)}`}
                onClick={() => onQuickTransaction && onQuickTransaction(ns.danhMuc)}
              >
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-ink-600 dark:group-hover:text-ink-300 transition-colors">
                    {label(ns.danhMuc)}
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
              </button><button type="button" disabled={saving||disabled} aria-label={'Gỡ ngân sách '+label(ns.danhMuc)} title="Gỡ hạn mức" onClick={()=>{setError('');setConfirm(ns);}} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4"/></button></div>{archived && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Danh mục đã bỏ khỏi danh sách. Khôi phục trong Quản lý danh mục để ghi khoản chi mới.</p>}</div>
            );
          })
        )}
      </div>
    </div><ConfirmModal isOpen={!!confirm} title="Gỡ ngân sách?" itemInfo={confirm?{label:label(confirm.danhMuc),value:periodLabel}:null} message="Chỉ gỡ hạn mức của tháng này. Các giao dịch và số dư được giữ nguyên." confirmText="Gỡ hạn mức" isLoading={saving} onClose={()=>{if(!saving)setConfirm(null);}} onConfirm={async()=>{if(lock.current)return;lock.current=true;setSaving(true);onBusyChange?.(true);try{await financeService.xoaNganSach(confirm.id);setDrafts(current=>{const next={...current};delete next[confirm.danhMuc];return next;});if(category===confirm.danhMuc)setAmount('');setConfirm(null);}catch(e){setError(e.response?.data?.message||'Chưa gỡ được hạn mức.');setConfirm(null);}finally{lock.current=false;setSaving(false);onBusyChange?.(false);}}}/>{error&&!editing&&<p role="alert" className="text-sm text-rose-600">{error}</p>}</>
  );
}

export default BudgetSection;
