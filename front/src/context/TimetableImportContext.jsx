import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { createTimetableImportJob } from '../services/timetableImportJob';

const Context = createContext(null);
export function TimetableImportProvider({ children }) {
  const [job] = useState(() => createTimetableImportJob(async (file, options) => {
    const { recognizeTimetable } = await import('../services/timetableImage');
    return recognizeTimetable(file, options);
  }));
  useEffect(() => () => job.dispose(), [job]);
  return <Context.Provider value={job}>{children}</Context.Provider>;
}
export function useTimetableImport() {
  const job = useContext(Context);
  const state = useSyncExternalStore(job.subscribe, job.snapshot);
  return { job, ...state };
}
