import { useSyncExternalStore } from 'react';
import { getLanguage, setLanguage, subscribeLanguage } from '../i18n/language';

export default function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => 'vi');
  return { language, setLanguage };
}
