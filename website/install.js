// Plainmark — a small convenience for installing an everyday tool, freely.
// Gopala Subramanium & contributors · GPL-3.0-or-later.
// Detection stays on this page: no network calls, storage, or analytics.
(() => {
  const select = document.getElementById('install-platform');
  const controls = document.getElementById('install-controls');
  const hint = document.getElementById('install-hint');
  const status = document.getElementById('install-status');
  const options = Array.from(document.querySelectorAll('.install-option'));
  if (!select || !controls || !hint || !status || !options.length) return;

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

  function show(platformName) {
    for (const option of options) option.hidden = option.dataset.platform !== platformName;
    status.textContent = '';
  }

  select.value = suggested;
  show(suggested);
  hint.textContent = suggested
    ? 'Suggested for your computer. You can choose another option.'
    : 'Plainmark is a desktop app. Choose the computer you want to install it on.';
  controls.hidden = false;
  select.addEventListener('change', () => {
    show(select.value);
    hint.textContent = select.value
      ? 'Copy the command, then paste it into your terminal.'
      : 'Choose the computer you want to install Plainmark on.';
  });

  for (const option of options) {
    const button = option.querySelector('button');
    const code = option.querySelector('code');
    const pre = option.querySelector('pre');
    button.hidden = false;
    button.setAttribute('aria-label', `Copy ${pre.getAttribute('aria-label')}`);
    button.addEventListener('click', async () => {
      const selectedPlatform = select.value;
      try {
        await navigator.clipboard.writeText(code.textContent);
        if (select.value === selectedPlatform) status.textContent = 'Copied. Paste into your terminal to continue.';
      } catch {
        if (select.value !== selectedPlatform) return;
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
