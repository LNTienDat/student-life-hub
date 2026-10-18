export function createPwaClient({ window, navigator, enabled }) {
  const media = window.matchMedia('(display-mode: standalone)');
  const installed = () => media.matches || navigator.standalone === true;
  let state = { online: navigator.onLine !== false, installed: installed(), canInstall: false, updateReady: false };
  let deferredPrompt;
  let registration;
  let applyingUpdate = false;
  let started = false;
  let disposed = false;
  const listeners = new Set();
  const cleanups = [];
  function update(values) {
    if (disposed) return;
    state = { ...state, ...values };
    listeners.forEach((listener) => listener());
  }
  function listen(target, name, callback) {
    target.addEventListener(name, callback);
    cleanups.push(() => target.removeEventListener(name, callback));
  }
  function checkWaiting() { update({ updateReady: Boolean(registration?.waiting) }); }
  return {
    getSnapshot: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    start() {
      if (started) return;
      started = true;
      listen(window, 'online', () => { update({ online: true }); registration?.update().catch(() => {}); });
      listen(window, 'offline', () => update({ online: false }));
      listen(media, 'change', () => update({ installed: installed() }));
      listen(window, 'beforeinstallprompt', (event) => {
        event.preventDefault(); deferredPrompt = event;
        update({ canInstall: true });
      });
      listen(window, 'appinstalled', () => {
        deferredPrompt = undefined;
        update({ installed: true, canInstall: false });
      });
      if (!enabled || !window.isSecureContext || !navigator.serviceWorker) return;
      listen(navigator.serviceWorker, 'controllerchange', () => {
        if (applyingUpdate) window.location.reload();
      });
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((result) => {
        if (disposed) return;
        registration = result;
        checkWaiting();
        const watchInstalling = () => {
          const worker = result.installing;
          if (worker) listen(worker, 'statechange', () => {
            if (worker.state === 'installed') update({ updateReady: Boolean(result.waiting || navigator.serviceWorker.controller) });
          });
        };
        watchInstalling();
        listen(result, 'updatefound', watchInstalling);
      }).catch(() => { /* The website remains usable if installation is unavailable. */ });
    },
    async install() {
      if (!deferredPrompt) return 'unavailable';
      const prompt = deferredPrompt;
      deferredPrompt = undefined; update({ canInstall: false });
      await prompt.prompt();
      const choice = await prompt.userChoice;
      return choice.outcome;
    },
    applyUpdate() {
      if (!registration?.waiting) return false;
      applyingUpdate = true;
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
      return true;
    },
    dispose() { disposed = true; cleanups.forEach((cleanup) => cleanup()); listeners.clear(); },
  };
}
