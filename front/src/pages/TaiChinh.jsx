import { t as tr, getLocale } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import useSessionDraft from '../hooks/useSessionDraft';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getCache, setCache } from '../services/apiCache';
import useDataRevision from '../hooks/useDataRevision';
import financeService from '../services/financeService';
import ConfirmModal from '../components/ConfirmModal';
import ReceiptImport from '../components/ReceiptImport';
import { useToast } from '../context/ToastContext';
import { useFinanceCategories } from '../context/FinanceCategoryContext';
import { Plus, Download, Camera } from 'lucide-react';
import FinanceKpiCards from './taichinh/FinanceKpiCards';
import BudgetSection from './taichinh/BudgetSection';
import FinanceTrendChart from './taichinh/FinanceTrendChart';
import FinancePeriodPicker from './taichinh/FinancePeriodPicker';
import TransactionForm from './taichinh/TransactionForm';
import TransactionTable from './taichinh/TransactionTable';
import { PageSkeleton } from '../components/Skeleton';
import { transactionQuery, financeSummary, localDateInput, readFinancePeriod, transactionDraft, transactionPayload, updateTransactionFilters } from './taichinh/financeUtils';

export default function TaiChinh() {
  useLanguage();
  const [period, setPeriod] = useSessionDraft('finance-period', () => localDateInput().slice(0, 7));
  // A new period gets fresh form/list state; late reads cannot replace another month's view.
  return <FinancePeriod key={period} period={period} onPeriodChange={setPeriod} />;
}
function FinancePeriod({ period, onPeriodChange }) {
  useLanguage();
  const { thang, nam } = readFinancePeriod(period);
  const label = thang + '/' + nam;
  const cacheKey = 'finance_cache:' + period;
  const [summary, setSummary] = useState(() => getCache(cacheKey));
  const [summaryError, setSummaryError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const revision = useDataRevision();
  const { label: categoryLabel, categories } = useFinanceCategories();
  const [filters, setFilters] = useState({ timKiem: '', locLoai: '', locDanhMuc: '' });
  const [searchScope, setSearchScope] = useState('month');
  const [customPeriod, setCustomPeriod] = useState(period);
  const allTime = searchScope === 'all';
  const searchPeriod = allTime ? null : readFinancePeriod(customPeriod);
  const searchMonth = searchPeriod?.thang, searchYear = searchPeriod?.nam;
  const searchLabel = searchPeriod ? searchMonth + '/' + searchYear : '';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [list, setList] = useState({ rows: [], pages: 1, total: 0, loading: true, error: '', key: '' });
  const [draft, setDraft] = useSessionDraft('finance-draft:'+period, null);
  const [original, setOriginal] = useSessionDraft('finance-original:'+period, null);
  const [receiptOpen,setReceiptOpen] = useState(false);
  const [receiptInfo,setReceiptInfo] = useState(null);
  useEffect(()=>()=>{if(receiptInfo?.imageURL)URL.revokeObjectURL(receiptInfo.imageURL);},[receiptInfo]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetDirty, setBudgetDirty] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState({ isOpen: false, isLoading: false });
  const formRef = useRef(null), returnFocus = useRef(null);
  const saveLock = useRef(false), deleteLock = useRef(false), exportLock = useRef(false);
  const { hienToast } = useToast();
  const busy = saving || budgetSaving || confirm.isLoading;
  const listKey = JSON.stringify([period, searchScope, customPeriod, searchMonth, searchYear, filters, page, revision, retry]);
  const listReady = list.key === listKey;
  const dirty = draft && JSON.stringify(draft) !== JSON.stringify(transactionDraft(original, period));

  const reload = useCallback(() => setRetry(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setSummaryLoading(true); setSummaryError('');
      try {
        const [stats, budgets, trend] = await Promise.all([
          financeService.layThongKe(thang, nam), financeService.layNganSach(thang, nam), financeService.layXuHuong(6, thang, nam),
        ]);
        if (!active) return;
        const value = financeSummary(stats.data, budgets.data, trend.data);
        setSummary(value); setCache(cacheKey, value);
      } catch (error) {
        if (active) setSummaryError(error.response?.data?.message || 'Chưa tải được số liệu. Thông tin đang hiển thị có thể chưa cập nhật.');
      } finally { if (active) setSummaryLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [thang, nam, cacheKey, revision, retry]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await financeService.layDanhSachGiaoDich(transactionQuery({ ...filters, chiThangNay: !allTime, thang: searchMonth, nam: searchYear }, page, pageSize));
        if (!active) return;
        const pages = response.data.soTrang || 1;
        if (page > pages) { setPage(pages); return; }
        setList({ rows: response.data.giaoDichs || [], pages, total: response.data.tongSo || 0, loading: false, error: '', key: listKey });
      } catch (error) {
        if (active) setList({ rows: [], pages: 1, total: 0, loading: false, key: listKey, error: error.response?.data?.message || 'Chưa tải được giao dịch. Hãy thử lại.' });
      }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [filters, page, pageSize, searchMonth, searchYear, allTime, listKey]);
  const editingId = original?.id;
  useEffect(() => {
    if (!draft) return;
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  // Focus only when an editor opens or switches to a different transaction.
  }, [Boolean(draft), editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  function withDiscard(action, protectBudget = true) {
    if (busy) return;
    if (!dirty && !(protectBudget && budgetDirty)) { action(); return; }
    setConfirm({ isOpen: true, type: 'warning', title: 'Bỏ thay đổi?', message: 'Nội dung đang nhập chưa được lưu.', confirmText: 'Bỏ thay đổi', cancelText: 'Nhập tiếp', onConfirm: () => { setConfirm({ isOpen: false }); action(); } });
  }
  function choosePeriod(value) {
    if (!busy && readFinancePeriod(value) && value !== period) onPeriodChange(value);
  }
  function openForm(transaction = null, trigger = null, category = null) {
    const open = () => {
      returnFocus.current = trigger;
      setReceiptInfo(null);
      setOriginal(transaction);
      setDraft({ ...transactionDraft(transaction, period), ...(category ? { danhMuc: category } : {}) });
      setFormError('');
    };
    // A budget draft is independent of the transaction form and is not discarded here.
    if (dirty) withDiscard(open, false); else if (!busy) open();
  }
  function closeForm() {
    const close = () => { setDraft(null); setOriginal(null); setReceiptInfo(null); setFormError(''); returnFocus.current?.isConnected && returnFocus.current.focus({ preventScroll: true }); };
    if (dirty) withDiscard(close, false); else if (!busy) close();
  }
  function updateDraft(key, value) {
    setDraft(current => ({ ...current, [key]: value, ...(key === 'loai' ? { danhMuc: value === 'thu' ? 'khac' : 'an_uong' } : {}) }));
    setFormError('');
  }
  async function saveTransaction(event,allowDuplicate=false) {
    event.preventDefault();
    if (saveLock.current) return;
    let payload;
    try { payload = transactionPayload(draft, original); } catch (error) { setFormError(error.message); return; }
    saveLock.current = true; setSaving(true); setFormError('');
    try {
      if (original) await financeService.suaGiaoDich(original.id, payload);
      else await financeService.themGiaoDich({...payload,...(allowDuplicate?{choPhepTrungHoaDon:true}:{})});
      setDraft(null); setOriginal(null); setReceiptInfo(null);
      if (!original) setPage(1);
      hienToast('success', original ? 'Đã cập nhật giao dịch.' : 'Đã thêm giao dịch.');
      if (!localDateInput(new Date(payload.ngayGiaoDich)).startsWith(period + '-')) hienToast('info', 'Giao dịch được lưu vào tháng ' + localDateInput(new Date(payload.ngayGiaoDich)).slice(0, 7) + '.');
      returnFocus.current?.isConnected && returnFocus.current.focus({ preventScroll: true });
      // Successful API mutations notify useDataRevision in this page and other tabs.
    } catch (error) { if(error.response?.data?.code==='RECEIPT_DUPLICATE')setConfirm({isOpen:true,type:'warning',title:'Hóa đơn đã được nhập',message:error.response.data.message,confirmText:'Vẫn lưu giao dịch mới',cancelText:'Quay lại kiểm tra',onConfirm:()=>{setConfirm({isOpen:false});saveTransaction({preventDefault(){}},true);}});else setFormError(error.response?.data?.message || 'Chưa lưu được giao dịch. Nội dung bạn nhập vẫn được giữ.'); }
    finally { saveLock.current = false; setSaving(false); }
  }
  function requestDelete(transaction) {
    if (busy) return;
    setConfirm({
      isOpen: true, type: 'danger', title: 'Xóa giao dịch?', confirmText: 'Xác nhận xóa', cancelText: 'Hủy bỏ',
      itemInfo: { label: transaction.moTa || categoryLabel(transaction.danhMuc,transaction.loai), value: transaction.soTien.toLocaleString(getLocale()) + ' đ' },
      message: 'Giao dịch sẽ được xóa. Thu/chi và ngân sách tháng sẽ cập nhật lại.',
      onConfirm: async () => {
        if (deleteLock.current) return;
        deleteLock.current = true; setConfirm(c => ({ ...c, isLoading: true }));
        try {
          await financeService.xoaGiaoDich(transaction.id);
          setConfirm({ isOpen: false });
          if (original?.id === transaction.id) { setDraft(null); setOriginal(null); setReceiptInfo(null); }
          hienToast('success', 'Đã xóa giao dịch.');
        } catch (error) {
          setConfirm({ isOpen: false });
          hienToast('error', error.response?.data?.message || 'Chưa xóa được giao dịch. Hãy thử lại.');
        } finally { deleteLock.current = false; }
      },
    });
  }
  async function saveBudget(data) {
    await financeService.datNganSach({ ...data, thang, nam });
    hienToast('success', 'Đã lưu ngân sách tháng ' + label + '.');
  }
  async function exportExcel() {
    if (exportLock.current) return;
    exportLock.current = true; setExporting(true);
    let url;
    try {
      const response = await financeService.xuatBaoCaoExcel(thang, nam);
      url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.download = 'bao-cao-tai-chinh-' + thang + '-' + nam + '.xlsx';
      document.body.appendChild(link); link.click(); link.remove();
      hienToast('success', 'Đã tải báo cáo tháng ' + label + '.');
    } catch (error) {
      let message = 'Chưa tải được báo cáo. Hãy thử lại.';
      const body = error.response?.data;
      if (body instanceof Blob) { try { message = JSON.parse(await body.text()).message || message; } catch { /* Non-JSON error. */ } }
      else if (body?.message) message = body.message;
      hienToast('error', message);
    } finally { if (url) URL.revokeObjectURL(url); exportLock.current = false; setExporting(false); }
  }
  function changeFilter(key, value) { setFilters(current => updateTransactionFilters(current, key, value, categories)); setPage(1); }

  return <>
    <div className="w-full min-w-0 space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{tr("Tài chính")}</h1><p className="mt-1 text-slate-500 dark:text-slate-400">{tr("Tháng ")}{label}{tr(" · Thu trừ chi trong tháng")}</p></div>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          <button type="button" onClick={exportExcel} disabled={exporting || summaryLoading || !!summaryError || !summary?.thongKe || (!summary.thongKe.tongThu && !summary.thongKe.tongChi)} className="flex min-h-11 justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-40"><Download size={17} />{exporting ? tr('Đang xuất…') : tr('Xuất Excel')}</button>
          <button type="button" disabled={busy} onClick={()=>withDiscard(()=>{setDraft(null);setOriginal(null);setReceiptInfo(null);setReceiptOpen(true);},false)} className="inline-flex min-h-11 justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-ink-300"><Camera size={17}/>{tr("Quét hóa đơn")}</button>
          <button type="button" disabled={busy} onClick={e => openForm(null, e.currentTarget)} className="col-span-2 md:col-auto flex min-h-11 justify-center items-center gap-2 rounded-xl bg-ink-600 px-4 text-sm font-medium text-white disabled:opacity-40"><Plus size={17} />{tr("Thêm giao dịch")}</button>
        </div>
      </div>
      <ReceiptImport open={receiptOpen} onClose={()=>setReceiptOpen(false)} onRecognized={(result,file)=>{setOriginal(null);setDraft({loai:'chi',danhMuc:result.danhMuc,soTien:result.soTien,anhHoaDonHash:result.anhHoaDonHash,moTa:result.moTa,ngayGiaoDich:result.ngayGiaoDich});setFormError('');setReceiptInfo({imageURL:URL.createObjectURL(file),text:result.text,warnings:result.warnings});}}/>
      <FinancePeriodPicker value={period} onChange={choosePeriod} disabled={busy} />
      <div ref={formRef} className="scroll-mt-28">
        {draft&&receiptInfo&&<section aria-label={tr("Hóa đơn đang kiểm tra")} className="mb-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="font-medium text-slate-700 dark:text-slate-200">{tr("Từ hóa đơn · chưa lưu. Kiểm tra nội dung bên dưới trước khi lưu giao dịch.")}</p>
          {receiptInfo.warnings.filter(message=>message.includes('ngày')?!draft.ngayGiaoDich:!draft.soTien).map(message=><p key={tr(message)} className="text-amber-700 dark:text-amber-300">{tr(message)}</p>)}
          <details><summary className="min-h-11 cursor-pointer py-2 text-ink-600 dark:text-ink-300">{tr("Xem ảnh hóa đơn")}</summary><img src={receiptInfo.imageURL} alt={tr("Hóa đơn đã chọn")} className="max-h-80 max-w-full rounded-xl object-contain"/></details>

        </section>}

        <TransactionForm hienFormGD={!!draft} {...(draft || {})} editing={!!original} error={formError} originalCategory={original?.loai === 'thu' ? original.danhMuc : null}
          onLoaiChange={value => updateDraft('loai', value)} onDanhMucChange={value => updateDraft('danhMuc', value)}
          onSoTienChange={value => updateDraft('soTien', value)} onMoTaChange={value => updateDraft('moTa', value)}
          onNgayGiaoDichChange={value => updateDraft('ngayGiaoDich', value)} onSubmit={saveTransaction} onCancel={closeForm} dangLuu={saving} />
      </div>
      {summaryError && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{summaryError}<button type="button" onClick={reload} className="ml-2 min-h-11 underline">{tr("Thử tải lại số liệu")}</button></div>}
      {summaryLoading && !summary ? <PageSkeleton /> : summary && <div aria-busy={summaryLoading}>
        {summaryLoading && <p role="status" className="mb-3 text-sm text-slate-500">{tr("Đang cập nhật số liệu…")}</p>}
        <FinanceKpiCards thongKe={summary.thongKe} />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSection nganSachs={summary.nganSachs} thongKe={summary.thongKe} periodLabel={label}
            onQuickTransaction={category => openForm(null, null, category)} onSaveBudget={saveBudget}
            onBusyChange={setBudgetSaving} onDirtyChange={setBudgetDirty} disabled={saving || confirm.isLoading} />
          <FinanceTrendChart xuHuong={summary.xuHuong} periodLabel={label} />
        </div>
      </div>}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div className="space-y-2 px-4 pt-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-900 dark:text-white">{allTime?tr('Tất cả giao dịch'):tr('Giao dịch tháng ')+searchLabel}</h2>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start">
              <FinancePeriodPicker value={customPeriod} fieldLabel={tr("Tháng/năm tìm giao dịch")} groupLabel={tr("Chọn tháng giao dịch")} disabled={busy} onChange={value=>{if(readFinancePeriod(value)){setCustomPeriod(value);setSearchScope('custom');setPage(1);}}}/>
              <button type="button" aria-pressed={allTime} disabled={busy} onClick={()=>{setSearchScope(allTime?'custom':'all');setPage(1);}} className={'min-h-11 rounded-xl border px-4 text-sm font-medium '+(allTime?'border-ink-600 bg-ink-600 text-white':'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200')}>{tr("Mọi thời gian")}</button>
            </div>
          </div>
          <p className="text-xs text-slate-500">{searchScope==='month'?tr('Lọc theo tháng đang xem hoặc chọn mốc thời gian khác.'):tr('Bộ lọc chỉ áp dụng cho giao dịch. Tổng quan phía trên vẫn theo tháng ')+label+'.'}</p>
        </div>
        <TransactionTable giaoDichs={listReady ? list.rows : []} dangTaiGD={!listReady || list.loading} {...filters}
          trangHienTai={page} soTrang={listReady ? list.pages : 1} tongSo={listReady ? list.total : 0} soLuongMoiTrang={pageSize} onPageSizeChange={size => { setPageSize(size); setPage(1); }} error={listReady ? list.error : ''} onRetry={reload}
          onTimKiemChange={value => changeFilter('timKiem', value)} onLocLoaiChange={value => changeFilter('locLoai', value)}
          onLocDanhMucChange={value => changeFilter('locDanhMuc', value)} onChonTrang={setPage}
          onResetFilters={()=>{setFilters({timKiem:'',locLoai:'',locDanhMuc:''});setPage(1);}} allTime={allTime} onSearchAllTime={()=>{setSearchScope('all');setPage(1);}} onYeuCauXoa={requestDelete} onEdit={openForm} disabled={busy} />
      </div>
    </div>
    <ConfirmModal {...confirm} onClose={() => { if (!confirm.isLoading) setConfirm({ isOpen: false }); }} />
  </>;
}
