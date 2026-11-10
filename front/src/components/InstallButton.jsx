import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';
import pwaClient from '../pwa/runtime';
export default function InstallButton({ className = 'shell-icon', children }) {
  useLanguage();
  const { installed, online } = useSyncExternalStore(pwaClient.subscribe, pwaClient.getSnapshot);
  if (installed) return null;
  return <button type="button" aria-label={tr("Cài LifeHub")} title={tr("Cài ứng dụng")} disabled={!online} onClick={() => window.dispatchEvent(new Event('slh:install-request'))} className={className}>
    <Download aria-hidden="true" className="h-5 w-5"/>
    {children}
  </button>;
}
