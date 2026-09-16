// Plainmark — a small convenience for installing an everyday tool, freely.
// Gopala Subramanium & contributors · GPL-3.0-or-later.
// Detection stays on this page: no network calls, storage, or analytics.
(() => {
  const select = document.getElementById('install-platform');
  const controls = document.getElementById('install-controls');
  const hint = document.getElementById('install-hint');
  const status = document.getElementById('install-status');
  const installer = document.querySelector('.installer');
  const methods = Array.from(document.querySelectorAll('[data-method-choice]'));
  const options = Array.from(document.querySelectorAll('.install-option'));
  let method = 'download';
  let revision = 0;
  if (!select || !controls || !hint || !status || !installer || !methods.length || !options.length) return;

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  // Check mobile/ChromeOS before Mac/Linux: iPads can report MacIntel.
  const unsupported = /Android|iPhone|iPad|iPod|Mobile|CrOS/i.test(ua)
    || (/Mac/i.test(platform) && navigator.maxTouchPoints > 1);
  let suggested = '';
  if (!unsupported) {
    if (/Windows/i.test(ua) || /^Win/i.test(platform)) suggested = 'windows';
    else if (/Mac/i.test(ua + platform)) suggested = 'macos';
    // Avoid suggesting our x64 AppImage on a browser reporting ARM Linux.
    else if (/Linux|X11/i.test(ua + platform) && !/arm|aarch64|BSD/i.test(ua + platform)) suggested = 'linux';
  }

  function show() {
    revision += 1;
    for (const option of options) {
      option.hidden = option.dataset.platform !== select.value;
      for (const panel of option.querySelectorAll('[data-method]')) {
        panel.hidden = panel.dataset.method !== method;
      }
    }
    for (const button of methods) {
      button.setAttribute('aria-pressed', String(button.dataset.methodChoice === method));
    }
    hint.hidden = Boolean(select.value);
    status.textContent = '';
  }

  select.value = suggested;
  installer.classList.add('enhanced');
  for (const option of options) {
    option.querySelector('.install-label').hidden = true;
    option.querySelector('.command-option').open = true;
  }
  show();
  controls.hidden = false;
  select.addEventListener('change', show);
  for (const button of methods) {
    button.addEventListener('click', () => {
      method = button.dataset.methodChoice;
      show();
    });
  }

  for (const option of options) {
    const button = option.querySelector('button');
    const code = option.querySelector('code');
    const pre = option.querySelector('pre');
    button.hidden = false;
    button.setAttribute('aria-label', `Copy ${pre.getAttribute('aria-label')}`);
    button.addEventListener('click', async () => {
      const copyRevision = revision;
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(code.textContent);
        if (revision === copyRevision) status.textContent = 'Copied. Paste into your terminal to continue.';
      } catch {
        if (revision !== copyRevision) return;
        // Clipboard access can be denied. Keep the exact visible command selectable.
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        pre.focus();
        status.textContent = 'Copy unavailable. Select the command and copy it manually.';
      }
    });
  }
})();
