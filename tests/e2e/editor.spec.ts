import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function source(page: Page, text: string) {
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Markdown editor' });
  await editor.click(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text);
  await expect(page.locator('#save-status')).toHaveText('Unsaved changes');
}
async function open(page: Page, text: string, name = 'sample.md') {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^Open a file/ }).click();
  await (await chooser).setFiles({ name, mimeType:'text/markdown', buffer:Buffer.from(text) });
  await expect(page.locator('#filename')).toHaveText(name);
  await expect(page.locator('#app')).not.toHaveClass(/busy/);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ['showOpenFilePicker','showSaveFilePicker','showDirectoryPicker']) Object.defineProperty(window,name,{value:undefined,configurable:true});
  });
  await page.goto('/');
  await expect(page.getByRole('textbox', { name:'Visual editor' })).toBeVisible();
});

test('starts in visual editing with outline, source access and persistent theme', async ({ page }, info) => {
  await expect(page.locator('.visual-document h1')).toHaveText('A little space for your words.');
  await expect(page.locator('#outline button')).toHaveCount(4);
  if (process.env.CAPTURE_SCREENSHOTS && info.project.name === 'chromium') await page.screenshot({path:'docs/screenshot.png'});
  await page.getByRole('button',{name:'Read',exact:true}).click();
  await expect(page.locator('#preview h1')).toBeVisible();
  await page.getByRole('button',{name:'Source',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Markdown editor'})).toBeVisible();
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  if (process.env.CAPTURE_SCREENSHOTS && info.project.name === 'chromium') { await expect(page.locator('.visual-document h1')).toBeVisible(); await page.screenshot({path:'docs/screenshot-dark.png'}); }
});

test('visual formatting writes Markdown and keeps undo across tabs and themes', async ({ page }) => {
  await page.getByRole('button',{name:'New tab',exact:true}).click();
  const visual = page.getByRole('textbox',{name:'Visual editor'});
  await visual.fill('My words');
  await page.keyboard.press('ControlOrMeta+A');
  await page.getByRole('button',{name:'Bold',exact:true}).click();
  await expect(visual.locator('strong')).toHaveText('My words');
  await page.getByRole('tab',{name:'welcome.md',exact:true}).click();
  await page.getByRole('tab',{name:/untitled.md/}).click();
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await visual.click(); await page.keyboard.press('ControlOrMeta+z');
  await expect(visual.locator('strong')).toHaveCount(0);
  await expect(visual).toContainText('My words');
  await page.getByRole('button',{name:'Source',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Markdown editor'})).toHaveText('My words');
});

test('tab closure protects changes and recovery retains every unsaved tab', async ({ page }) => {
  await source(page,'# First draft');
  await page.getByRole('button',{name:'New tab',exact:true}).click();
  await page.getByRole('textbox',{name:'Visual editor'}).fill('Second draft');
  await page.getByRole('button',{name:'Close untitled.md',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Keep your changes?'})).toBeVisible();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  page.on('dialog',dialog=>dialog.accept());
  await page.reload();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.locator('#toast')).toContainText('Recovered 2');
  const visual = page.getByRole('textbox',{name:'Visual editor'});
  await visual.fill('Second draft changed'); await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('#save-status')).toHaveText('Unsaved changes');
  await page.getByRole('button',{name:'Close untitled.md',exact:true}).click();
  await page.getByRole('button',{name:'Discard changes',exact:true}).click();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(page.locator('.visual-document h1')).toHaveText('First draft');
});

test('view switching preserves original Markdown and saving retains BOM and CRLF', async ({ page }) => {
  const text='\ufeff# Local file\r\n\r\n__Unchanged__   wording\r\n';
  await open(page,text,'local.md');
  await page.getByRole('button',{name:'Source',exact:true}).click();
  await page.getByRole('button',{name:'Visual',exact:true}).click();
  const first = page.waitForEvent('download'); await page.locator('[data-action="save"]').click();
  expect(await readFile((await (await first).path())!,'utf8')).toBe(text);
  await source(page,'# Changed\nWorld\n');
  const download=page.waitForEvent('download'); await page.locator('[data-action="save"]').click();
  const result=await download; expect(result.suggestedFilename()).toBe('local.md');
  expect(await readFile((await result.path())!,'utf8')).toBe('\ufeff# Changed\r\nWorld\r\n');
});

test('tasks and tables edit as document content and serialize correctly', async ({ page }) => {
  await open(page,'- [ ] Complete me\n\n| Name | State |\n| --- | --- |\n| Initial | Draft |\n');
  await page.getByRole('checkbox',{name:'Task complete'}).click();
  const cell=page.locator('.visual-document td').first(); await cell.click(); await page.keyboard.press('Home'); await page.keyboard.insertText('Updated ');
  await page.locator('.insert-menu summary').click(); await page.getByRole('button',{name:'Add table row',exact:true}).click();
  await expect(page.locator('.visual-document tr')).toHaveCount(3);
  await page.getByRole('button',{name:'Source',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Markdown editor'})).toContainText('[x] Complete me');
  await expect(page.getByRole('textbox',{name:'Markdown editor'})).toContainText('Updated');
});

test('Mermaid, MathML, and SVG previews render locally', async ({ page }) => {
  const remote:string[]=[]; page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:1420'))remote.push(r.url());});
  const svg='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="tomato"/></svg>');
  await source(page,'# Rich document\n\nMath $x^2$\n\n$$\n\\frac{1}{2}\n$$\n\n```mermaid\nflowchart LR\n A[Write] --> B[Share]\n```\n\n![Shape]('+svg+')');
  await expect(page.locator('#preview math')).toHaveCount(2);
  await expect(page.locator('#preview img.diagram-image')).toBeVisible({timeout:20000});
  await expect(page.locator('#preview img[alt="Shape"]')).toBeVisible();
  expect(remote).toEqual([]);
  await page.getByRole('button',{name:'Visual',exact:true}).click();
  await expect(page.locator('.visual-document math')).toHaveCount(2);
  await expect(page.locator('.visual-document img.diagram-image')).toBeVisible();
});

test('HTML executes only on demand in an opaque sandbox and stops on tab switch', async ({ page }) => {
  await source(page,'```html\n<button onclick="this.textContent=\'Clicked\'">Try me</button><p id="isolation">waiting</p><script>try{parent.document.body.dataset.hacked=1}catch(e){document.querySelector("#isolation").textContent="Parent blocked"}fetch("https://example.com/blocked").catch(()=>document.querySelector("#isolation").textContent+="; fetch blocked")</script>\n```');
  await expect(page.locator('#preview iframe')).toHaveCount(0);
  await page.locator('#preview').getByRole('button',{name:'Run HTML',exact:true}).click();
  const frame=page.frameLocator('iframe.html-runner');
  await expect(frame.locator('#isolation')).toHaveText('Parent blocked; fetch blocked');
  await frame.getByRole('button',{name:'Try me'}).click();
  await expect(frame.getByRole('button',{name:'Clicked'})).toBeVisible();
  await expect(page.locator('body')).not.toHaveAttribute('data-hacked');
  await expect(page.locator('iframe.html-runner')).toHaveAttribute('sandbox','allow-scripts');
  await page.getByRole('button',{name:'New tab',exact:true}).click();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('folder workspace browses nested files, deduplicates tabs and resolves SVG images', async ({ page }) => {
  const chooser=page.waitForEvent('filechooser'); await page.getByRole('button',{name:'Open a folder'}).click();
  await (await chooser).setFiles(path.resolve('tests/e2e/fixtures/workspace'));
  await page.locator('#folders summary').filter({hasText:'notes'}).click();
  await page.getByRole('button',{name:'nested.md',exact:true}).click();
  await expect(page.locator('.visual-document img[alt="Local shape"]')).toBeVisible();
  await page.getByRole('textbox',{name:'Visual editor'}).press('ControlOrMeta+End'); await page.keyboard.insertText('changed');
  await page.getByRole('button',{name:'nested.md',exact:true}).click();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('textbox',{name:'Visual editor'})).toContainText('changed');
});

test('hostile Markdown remains inert and exports include no executable content', async ({ page }) => {
  await source(page,'# Export me\n\n**Offline**\n\n<script>window.hacked=true</script>\n\n![tracking](https://example.com/pixel.gif)');
  await expect(page.locator('#preview')).toContainText('Remote image blocked');
  await expect(page.locator('#preview script, #preview [onerror]')).toHaveCount(0);
  const download=page.waitForEvent('download'); await page.getByRole('button',{name:'Export HTML',exact:true}).click();
  const html=await readFile((await (await download).path())!,'utf8');
  expect(html).toContain('<strong>Offline</strong>'); expect(html).toContain("default-src 'none'"); expect(html).not.toContain('<script>'); expect(html).not.toContain('<iframe');
});

test('split scrolling follows block positions and reaches both document ends', async ({ page }) => {
  const text=Array.from({length:24},(_,i)=>`## Section ${i}\n\n${'A longer paragraph with wrapping words. '.repeat(8)}\n\n\`\`\`js\nconst item = ${i};\n\`\`\`\n`).join('\n');
  await source(page,text);
  await page.locator('#preview h2').nth(12).evaluate(el=>{ const pane=el.closest('#preview-scroll')!; pane.scrollTop += el.getBoundingClientRect().top-pane.getBoundingClientRect().top; });
  await expect.poll(()=>page.locator('.cm-scroller').evaluate(el=>el.scrollTop)).toBeGreaterThan(100);
  await expect.poll(()=>page.locator('.cm-line').allTextContents()).toContain('## Section 12');
  await expect.poll(()=>page.locator('.cm-line').filter({hasText:/^## Section 12$/}).evaluate(el=>Math.abs(el.getBoundingClientRect().top-el.closest('.cm-scroller')!.getBoundingClientRect().top))).toBeLessThan(3);
  await page.locator('.cm-scroller').hover(); await page.mouse.wheel(0,100000);
  await expect.poll(()=>page.locator('#preview-scroll').evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThan(3);
  await page.locator('#preview-scroll').hover(); await page.mouse.wheel(0,-100000);
  await expect.poll(()=>page.locator('.cm-scroller').evaluate(el=>el.scrollTop)).toBeLessThan(3);
});

test('small screens keep visual editing usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('[data-action="save"]')).toBeVisible();
  await expect(page.locator('.visual-document h1')).toBeVisible();
  expect(await page.evaluate(()=>document.body.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Toggle sidebar'}).click();
  await expect(page.getByRole('button',{name:'Open a folder'})).toBeVisible();
});
