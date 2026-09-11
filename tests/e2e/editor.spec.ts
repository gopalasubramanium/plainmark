import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function replaceEditor(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Markdown editor' }).click();
  await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
  });
  await page.goto('/');
});

test('welcome, view switching, outline and theme all work', async ({ page }, testInfo) => {
  await expect(page.locator('#preview h1')).toHaveText('A little space for your words.');
  await expect(page.locator('#outline button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Read', exact: true }).click();
  await expect(page.locator('.editor-pane')).toBeHidden();
  await page.getByRole('button', { name: 'Write', exact: true }).click();
  await expect(page.locator('.preview-pane')).toBeHidden();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  if (process.env.CAPTURE_SCREENSHOTS && testInfo.project.name === 'chromium') await page.screenshot({ path: 'docs/screenshot.png' });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  if (process.env.CAPTURE_SCREENSHOTS && testInfo.project.name === 'chromium') await page.screenshot({ path: 'docs/screenshot-dark.png' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('editing updates the preview and recovers an unsaved draft on reload', async ({ page }) => {
  await replaceEditor(page, '# My own words\n\nA private draft.');
  await expect(page.locator('#preview h1')).toHaveText('My own words');
  await expect(page.locator('#save-status')).toHaveText('Unsaved changes');
  page.on('dialog', (dialog) => dialog.accept());
  await page.reload();
  await expect(page.locator('#preview h1')).toHaveText('My own words');
  await expect(page.locator('#toast')).toContainText('Recovered');
});

test('cancel protects edits and discard allows a new document', async ({ page }) => {
  await replaceEditor(page, '# Keep me');
  await page.getByRole('button', { name: 'New document' }).click();
  await expect(page.getByRole('dialog', { name: 'Keep your changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#preview h1')).toHaveText('Keep me');
  await page.getByRole('button', { name: 'New document' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.locator('#filename')).toHaveText('untitled.md');
  await expect(page.getByRole('textbox', { name: 'Markdown editor' })).toHaveText('');
  await expect(page.locator('#preview')).toHaveText('');
});

test('opens a local file and downloads exact edited Markdown', async ({ page }) => {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Open a file' }).click();
  await (await chooser).setFiles({ name: 'local.md', mimeType: 'text/markdown', buffer: Buffer.from('# Local file\r\nHello\r\n') });
  await expect(page.locator('#preview h1')).toHaveText('Local file');
  await replaceEditor(page, '# Changed\nWorld\n');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: /^Save/ }).click();
  const result = await download; expect(result.suggestedFilename()).toBe('local.md');
  expect(await readFile((await result.path())!, 'utf8')).toBe('# Changed\r\nWorld\r\n');
});

test('formatting and find replace change actual source text', async ({ page }) => {
  await page.getByRole('button', { name: 'New document' }).click();
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(page.locator('#preview strong')).toHaveText('bold text');
  await replaceEditor(page, 'apple apple');
  await page.getByRole('button', { name: 'Find and replace' }).click();
  await page.getByPlaceholder('Find').fill('apple');
  await page.getByPlaceholder('Replace').fill('pear');
  await page.getByRole('button', { name: 'replace all', exact: true }).click();
  await expect(page.locator('#preview')).toContainText('pear pear');
});

test('hostile markdown stays inert and remote images make no requests', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:1420')) remote.push(request.url()); });
  await replaceEditor(page, '# Safe\n\n<script>window.hacked=true</script>\n\n<img src=x onerror="window.hacked=true">\n\n![tracking](https://example.com/pixel.gif)\n\n[bad](javascript:alert%281%29)');
  await expect(page.locator('#preview')).toContainText('Remote image blocked');
  await expect(page.locator('#preview script, #preview img, #preview [onerror]')).toHaveCount(0);
  expect(remote).toEqual([]);
});

test('exports a standalone HTML document', async ({ page }) => {
  await replaceEditor(page, '# Export me\n\n**Offline** and readable.');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export HTML' }).click();
  const result = await download;
  expect(result.suggestedFilename()).toBe('welcome.html');
  const html = await readFile((await result.path())!, 'utf8');
  expect(html).toContain('<h1 id="section-0">Export me</h1>');
  expect(html).toContain('<strong>Offline</strong>');
  expect(html).toContain("default-src 'none'");
});

test('small screens retain usable controls without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Save', exact: false })).toBeVisible();
  await expect(page.locator('#preview h1')).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Open a file' })).toBeVisible();
});
