import { createWorker } from 'tesseract.js';
import { parseLines } from '../src/lib/parse';
import { summarize } from '../src/lib/classify';
import { findSeparators } from '../src/lib/separators';
import { readFileSync, existsSync } from 'node:fs';
const img = process.argv[2];
const worker = await createWorker('kor+eng', 1, { langPath: 'public/tess', gzip: false, logger: () => {} });
const { data } = await worker.recognize(img, {}, { blocks: true });
const lines: any[] = [];
for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines)
  lines.push({ text: l.text.trim(), x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1, words: l.words.map((w:any)=>({text:w.text,x0:w.bbox.x0,y0:w.bbox.y0,x1:w.bbox.x1,y1:w.bbox.y1})) });
for (const l of lines) console.log(`${String(l.x0).padStart(4)} ${String(l.y0).padStart(4)}-${String(l.y1).padEnd(4)} | ${l.text}`);
// 회색조 raw 파일(<img>.gray, 첫 8바이트 = w,h uint32 LE)이 있으면 구분선 검출
let seps: number[] = [];
if (existsSync(img + '.gray')) {
  const buf = readFileSync(img + '.gray');
  const w = buf.readUInt32LE(0), h = buf.readUInt32LE(4);
  seps = findSeparators(new Uint8Array(buf.buffer, buf.byteOffset + 8, w * h), w, h);
  console.log('\nSEPARATORS', seps.map(s=>s.toFixed(0)).join(' '));
}
const r = parseLines(lines, seps);
console.log('\nROWS'); for (const row of r.rows) console.log(row.cls, '::', row.text);
console.log('\nIgE', r.totalIgE);
console.log('\nFAMILIES', summarize(r.findings).map(f => `${f.family}${f.cls}`).join(' '));
console.log('\nUNMATCHED', r.findings.filter(f => f.no === null).map(f => f.raw));
await worker.terminate();
