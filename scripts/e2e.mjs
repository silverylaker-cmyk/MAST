import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
// 사용법: node scripts/e2e.mjs <결과지 이미지> [출력 폴더]
const IMG = process.argv[2] ?? 'scripts/sample.png';
const S = process.argv[3] ?? '/tmp/claude-0/-home-user-MAST/7a7046b2-d10a-5faa-bfd0-f0bb7d164a82/scratchpad';
const server = await createServer({ root: '/home/user/MAST', base: '/', server: { port: 5199 } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
const qs = process.env.QS ?? '';
await page.goto('http://localhost:5199/' + qs);
await page.setInputFiles('input[type=file]', IMG);
const t0=Date.now();
await page.waitForSelector('.review', { timeout: 180000 });
console.log('OCR took', ((Date.now()-t0)/1000).toFixed(1),'s');
const rows = await page.$$eval('.review tbody tr', trs => trs.map(tr => ({
  raw: tr.children[0].textContent, cls: tr.querySelectorAll('select')[1].value,
  matched: tr.querySelectorAll('select')[0].selectedOptions[0].textContent, klass: tr.className })));
if (!process.env.QUIET) console.log(JSON.stringify(rows, null, 0).replace(/\},\{/g,'},\n{'));
console.log('chips:', await page.$$eval('.chips span', s => s.map(x=>x.textContent).join(' | ')));
console.log('warn:', await page.$$eval('.warn', s => s.map(x=>x.textContent)));
console.log('IgE:', await page.$eval('input[type=number]', i=>i.value));
await page.screenshot({ path: path.join(S,'review.png'), fullPage: true });
if (process.env.QUIET) { await browser.close(); await server.close(); process.exit(0); }
await page.click('button.primary');
await page.waitForSelector('.show');
const N = await page.$$eval(".show-top .counter", e=>Number(e[0].textContent.split("/")[1].trim().split(" ")[0]));
for (let i=0;i<N;i++){ await page.waitForTimeout(Number(process.env.WAIT ?? 4500)); await page.screenshot({ path: path.join(S,`slide${i+1}.png`) }); if(i<N-1) await page.click('.show-top button:nth-of-type(2)'); }
await browser.close(); await server.close();
