import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { readDraft, saveDraft } from '../services/drafts';
export default function useSessionDraft(name,initial) {
  const {user}=useAuth();
  const [value,setValue]=useState(()=>readDraft(sessionStorage,user.id,name,initial));
  const current=useRef(value);
  const update=useCallback(change=>{
    const next=typeof change==='function'?change(current.current):change;
    current.current=next;
    saveDraft(sessionStorage,user.id,name,next);
    setValue(next);
  },[user.id,name]);
  return [value,update];
}
