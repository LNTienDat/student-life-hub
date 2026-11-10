import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import useDataRevision from '../hooks/useDataRevision';
import { TEN_DANH_MUC } from '../constants';
import { categoryDisplayName } from '../utils/categoryDisplayName';
import { t } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';

const CategoryContext = createContext(null);
const defaults = ['an_uong','di_lai','khac'].map(ma=>({ma,ten:TEN_DANH_MUC[ma],loai:'chi',macDinh:true,coTheXoa:true,daAn:false})).concat({ma:'khac',ten:'Khác',loai:'thu',macDinh:true,coTheXoa:true,daAn:false});
export function FinanceCategoryProvider({children}) {
  useLanguage();
  const [categories,setCategories]=useState(defaults);
  const [error,setError]=useState('');
  const [loaded,setLoaded]=useState(false);
  const [retry,setRetry]=useState(0);
  const version=useRef(0);
  const revision=useDataRevision({externalOnly:true});
  useEffect(()=>{
    let active=true;
    const read=++version.current;
    api.get('/finance/danh-muc').then(({data})=>{
      if(!Array.isArray(data.danhMucs))throw new Error('Invalid categories');
      if(active&&read===version.current){setCategories(data.danhMucs);setError('');setLoaded(true);}
    }).catch(()=>{if(active&&read===version.current)setError('Chưa tải được danh mục riêng.');});
    return()=>{active=false;};
  },[revision,retry]);
  async function changeCategory(request) {
    version.current++;
    try {
      const {data}=await request();
      const changed=data.danhMuc;
      setCategories(previous=>[...previous.filter(item=>item.ma!==changed.ma||item.loai!==changed.loai),changed]);
      return changed;
    } finally { setRetry(value=>value+1); }
  }
  const addCategory=(loai,ten)=>changeCategory(()=>api.post('/finance/danh-muc',{loai,ten}));
  const renameCategory=(ma,ten,loai)=>changeCategory(()=>api.put('/finance/danh-muc/'+encodeURIComponent(ma),{ten,loai}));
  const removeCategory=(ma,loai)=>changeCategory(()=>api.delete('/finance/danh-muc/'+encodeURIComponent(ma),{params:{loai}}));
  const label=(code,loai='chi')=>{const item=categories.find(item=>item.ma===code&&item.loai===loai);return item ? categoryDisplayName(item) : t(TEN_DANH_MUC[code]) || code;};
  return <CategoryContext.Provider value={{categories,loaded,label,error,retry:()=>setRetry(value=>value+1),addCategory,removeCategory,renameCategory}}>{children}</CategoryContext.Provider>;
}
export function useFinanceCategories(){return useContext(CategoryContext);}
