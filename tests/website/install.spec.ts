import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const cases = [
  ['Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0, 'windows'],
  ['Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0, 'macos'],
  ['Linux', 'Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64', 0, 'linux'],
  ['Android', 'Mozilla/5.0 (Linux; Android 14) Mobile', 'Linux armv8l', 5, ''],
  ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5, ''],
  ['iPad desktop mode', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5, ''],
  ['ChromeOS', 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0)', 'Linux x86_64', 0, ''],
  ['ARM Linux', 'Mozilla/5.0 (X11; Linux aarch64)', 'Linux aarch64', 0, ''],
  ['unknown', '', '', 0, ''],
] as const;

for (const [name, userAgent, platform, maxTouchPoints, expected] of cases) {
  test(`suggests a suitable download for ${name}`, async ({ page }) => {
    await page.addInitScript(({ userAgent, platform, maxTouchPoints }) => {
      Object.defineProperties(navigator, {
        userAgent: { value: userAgent }, platform: { value: platform },
        maxTouchPoints: { value: maxTouchPoints },
      });
    }, { userAgent, platform, maxTouchPoints });
    const external: string[] = [];
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:18241/')) external.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByLabel('Installation platform')).toBeVisible();
    await expect(page.getByLabel('Installation platform')).toHaveValue(expected);
    await expect(page.locator('.install-option:visible')).toHaveCount(expected ? 1 : 0);
    if (expected) await expect(page.locator(`.install-option[data-platform="${expected}"]`)).toBeVisible();
    await expect(page.locator('[data-method="command"]:visible')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(external).toEqual([]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
  });
}

test('manual selection copies the exact displayed command and clears stale feedback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => { (window as any).copied = text; } },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use a command', exact: true }).click();
  for (const platform of ['windows', 'macos', 'linux', 'debian']) {
    await page.getByLabel('Installation platform').selectOption(platform);
    await expect(page.getByRole('status')).toBeEmpty();
    const option = page.locator(`.install-option[data-platform="${platform}"]`);
    await expect(page.locator('.install-option:visible')).toHaveCount(1);
    await option.getByRole('button').click();
    await expect(page.getByRole('status')).toContainText('Copied.');
    expect(await page.evaluate(() => (window as any).copied)).toBe(await option.locator('code').textContent());
  }
});

test('clipboard denial leaves a focused, selected command for manual copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => { throw new Error('Permission denied'); } },
    });
  });
  await page.goto('/');
  await page.getByLabel('Installation platform').selectOption('windows');
  await page.getByRole('button', { name: 'Use a command', exact: true }).click();
  await page.getByRole('button', { name: 'Copy Windows installation command' }).click();
  await expect(page.getByRole('status')).toContainText('Copy unavailable.');
  await expect(page.getByRole('status')).not.toContainText('Copied.');
  const pre = page.getByLabel('Windows installation command', { exact: true });
  await expect(pre).toBeFocused();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(await pre.textContent());
});

test('commands and regular downloads remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:18241/');
  await expect(page.locator('.install-option:visible')).toHaveCount(4);
  await expect(page.locator('.copy-command:visible')).toHaveCount(0);
  await expect(page.getByLabel('Installation platform')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', 'https://get.microsoft.com/installer/download/9PB6H8Z02K0G');
  await expect(page.getByRole('link', { name: 'Download AppImage' })).toBeVisible();
  await expect(page.locator('.install-command:visible')).toHaveCount(0);
  await page.locator('[data-platform="windows"] .command-option > summary').click();
  await expect(page.locator('[data-platform="windows"] code')).toBeVisible();
  await context.close();
});

test('mobile layout contains long commands and keeps controls accessible', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const select = page.getByLabel('Installation platform');
  await page.getByRole('button', { name: 'Use a command', exact: true }).click();
  for (const platform of ['windows', 'macos', 'linux', 'debian']) {
    await select.selectOption(platform);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const button = page.locator('.install-option:visible button');
    await expect(button).toBeVisible();
    await page.getByRole('button', { name: 'Use a command', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.install-option:visible pre')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
  }
  await page.locator('.installer').screenshot({ path: testInfo.outputPath('install-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await select.selectOption('macos');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: testInfo.outputPath('install-desktop.jpg'), type: 'jpeg', quality: 70 });
});

test('commands use the published Store ID, official tap, and matching release assets', async ({ page }) => {
  await page.goto('/');
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  expect(await page.locator('[data-platform="windows"] code').textContent()).toBe('winget install --id 9PB6H8Z02K0G --source msstore');
  const brew = await page.locator('[data-platform="macos"] code').textContent();
  expect(brew).toBe('brew install --cask gopalasubramanium/plainmark/plainmark@preview');
  expect(readFileSync('README.md', 'utf8')).toContain(brew);
  for (const [platform, suffix] of [['linux', 'AppImage'], ['debian', 'deb']]) {
    const filename = `Plainmark_${version}_amd64.${suffix}`;
    const url = `https://github.com/gopalasubramanium/plainmark/releases/download/v${version}/${filename}`;
    const command = await page.locator(`[data-platform="${platform}"] code`).textContent();
    expect(command).toContain(`curl -fLO ${url} && `);
    expect(command).toContain(filename);
    expect(await page.locator(`[data-method="download"] a[href="${url}"]`).count()).toBe(1);
    expect(command).not.toMatch(/\|\s*(ba)?sh|--insecure|--ignore/);
  }
});


test('one installation area shows only the chosen method and preserves the selected OS', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#download')).toHaveCount(1);
  await expect(page.locator('.download-section, .quick-install')).toHaveCount(0);
  await page.getByLabel('Installation platform').selectOption('windows');
  await expect(page.locator('[data-method="download"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-method="command"]:visible')).toHaveCount(0);
  const commandButton = page.getByRole('button', { name: 'Use a command', exact: true });
  await commandButton.focus();
  await page.keyboard.press('Enter');
  await expect(commandButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Installation platform')).toHaveValue('windows');
  await expect(page.locator('[data-method="download"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-method="command"]:visible')).toHaveCount(1);
  await page.getByLabel('Installation platform').selectOption('macos');
  await expect(page.locator('[data-platform="macos"] code')).toBeVisible();
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(page.getByLabel('Installation platform')).toHaveValue('macos');
  await expect(page.getByRole('link', { name: 'Mac · Apple Silicon' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mac · Intel' })).toBeVisible();
  await expect(page.locator('.install-command:visible')).toHaveCount(0);
});

test('a delayed copy cannot show stale feedback after changing the installation method', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => new Promise<void>(resolve => { (window as any).finishCopy = resolve; }) },
    });
  });
  await page.goto('/');
  await page.getByLabel('Installation platform').selectOption('windows');
  await page.getByRole('button', { name: 'Use a command', exact: true }).click();
  await page.getByRole('button', { name: 'Copy Windows installation command' }).click();
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await page.evaluate(() => (window as any).finishCopy());
  await expect(page.getByRole('status')).toBeEmpty();
});
