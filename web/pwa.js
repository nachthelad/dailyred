import { t } from './i18n.js';

export function setupPwa() {
  const button = document.getElementById('install');
  const panel = document.getElementById('install-panel');
  const action = document.getElementById('install-action');
  const help = document.getElementById('install-help');
  const standalone = matchMedia('(display-mode: standalone)');
  let installed = navigator.standalone === true || standalone.matches;
  let opportunity = null;
  let timer;
  const close = () => {
    clearTimeout(timer);
    if (panel.contains(document.activeElement)) button.focus();
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function refresh() {
    button.hidden = installed;
    button.title = t('install');
    button.setAttribute('aria-label', t('install'));
    action.textContent = t('install');
    action.hidden = !opportunity;
    help.textContent = t(opportunity ? 'installHint' : ios ? 'installIos' : 'installMenu');
    if (installed) close();
  }
  function open(auto = false) {
    if (installed) return;
    clearTimeout(timer);
    refresh();
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    if (auto) timer = setTimeout(close, 3000);
  }
  button.addEventListener('click', () => panel.hidden ? open() : close());
  document.getElementById('install-close').addEventListener('click', close);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
  // Allow time to read when interacting with the automatic invitation.
  panel.addEventListener('focusin', () => clearTimeout(timer));
  panel.addEventListener('pointerdown', () => clearTimeout(timer));
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    opportunity = event;
    refresh();
  });
  action.addEventListener('click', async () => {
    const event = opportunity;
    if (!event) return;
    opportunity = null; // each native opportunity can only be consumed once
    close();
    try { await event.prompt(); await event.userChoice; }
    catch { open(); }
    refresh();
  });
  const markInstalled = () => { installed = true; opportunity = null; refresh(); };
  window.addEventListener('appinstalled', markInstalled);
  standalone.addEventListener('change', event => {
    installed = event.matches || navigator.standalone === true;
    refresh();
  });
  refresh();
  let shown = false;
  try {
    shown = sessionStorage.getItem('dailyred-install-shown') === '1';
    sessionStorage.setItem('dailyred-install-shown', '1');
  } catch { /* one invitation per document if storage is blocked */ }
  if (!shown && !installed) open(true);
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline cache unavailable', error));
  }
  return { refresh };
}
