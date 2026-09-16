import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recognizeReport } from './recognize-report';
import { mergeParsed, parseLines, type OcrLine } from './parse';

const lines: OcrLine[] = [
  { text: '0.00 ~ 0.34 0 없거나 아주 낮음', x0: 20, y0: 20, x1: 700, y1: 40 },
  { text: '0.35 ~ 0.69 1 낮음 새우', x0: 20, y0: 60, x1: 700, y1: 80 },
  { text: '0.70 ~ 3.49 2 보통 우유', x0: 20, y0: 100, x1: 700, y1: 120 },
];

test('partial separators cannot discard or combine class rows', () => {
  const expected = parseLines(lines).findings;
  assert.deepEqual(parseLines(lines, [10, 50, 90]).findings, expected);
  assert.deepEqual(parseLines(lines, [10, 50, 130]).findings, expected);
});

test('class disagreements keep primary class and request review', () => {
  const a = parseLines(lines);
  const b = { ...a, findings: a.findings.map((f) => ({ ...f, cls: 6 })) };
  const merged = mergeParsed(a, b);
  assert.deepEqual(merged.findings.map((f) => f.cls), a.findings.map((f) => f.cls));
  assert.ok(merged.findings.every((f) => f.score < 0.8));
  assert.equal(merged.warnings?.length, 2);
});

test('failed additional passes retain the successful first result', async () => {
  let count = 0;
  const result = await recognizeReport('', async () => {
    if (count++ > 0) throw new Error('worker failure');
    return { lines, separators: [] };
  }, () => {});
  assert.deepEqual(result.findings, parseLines(lines).findings);
  assert.ok(result.warnings?.some((w) => w.includes('성공한 판독')));
});

test('automatic contrast retry recovers an unreadable image', async () => {
  const result = await recognizeReport('', async (_image, _progress, _scale, _crop, threshold) => ({
    lines: threshold === -2 ? lines : [], separators: [],
  }), () => {});
  assert.deepEqual(result.findings, parseLines(lines).findings);
});

test('total OCR failure is reported', async () => {
  await assert.rejects(recognizeReport('', async () => { throw new Error('offline'); }, () => {}), /이미지를 읽지 못했습니다/);
});

test('class and name association survives scaled coordinates', () => {
  const shifted = lines.map((l) => ({ ...l, x0: l.x0 + (l.text.includes('새우') ? 80 : 0) }));
  const expected = parseLines(shifted).findings;
  for (const scale of [0.5, 2, 4]) {
    const scaled = shifted.map((l) => ({ ...l, x0: l.x0 * scale, x1: l.x1 * scale, y0: l.y0 * scale, y1: l.y1 * scale }));
    assert.deepEqual(parseLines(scaled).findings, expected);
  }
});
