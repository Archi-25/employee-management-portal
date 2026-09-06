/**
 * Renders docs/viva-guide.html to docs/VIVA-GUIDE.pdf.
 *   node scripts/build-viva-pdf.mjs
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const html = resolve('docs/viva-guide.html');
const pdf = resolve('docs/VIVA-GUIDE.pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdf,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:8pt;color:#8b93a3;padding:0 14mm;' +
    'font-family:Helvetica,Arial,sans-serif;display:flex;justify-content:space-between">' +
    '<span>Employee Management Portal — Viva Guide</span>' +
    '<span class="pageNumber"></span>/<span class="totalPages"></span></div>',
});
await browser.close();
console.log(`PDF written: ${pdf}`);
