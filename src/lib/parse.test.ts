import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLines, splitTokens, type OcrLine } from './parse';
import { matchToken, normalize } from './match';
import { summarize, bucket } from './classify';

test('normalize strips codes and punctuation', () => {
  assert.equal(normalize('rDer p 10 (진드기 (Dp))'), 'rderp10진드기dp');
  assert.equal(normalize('rTri a 19 (밀단백질)(F416)'), 'rtria19밀단백질');
  assert.equal(normalize('D. pteronyssinus (집먼지진드기)(Dp)(D1)'), 'dpteronyssinus집먼지진드기dp');
});

test('matchToken: plain korean names', () => {
  assert.equal(matchToken('소고기').allergen?.name_en, 'Beef');
  assert.equal(matchToken('집먼지').allergen?.name_en, 'House dust');
  assert.equal(matchToken('진드기 Df').allergen?.name_en, 'D. farinae');
  assert.equal(matchToken('진드기 Dp').allergen?.name_en, 'D. pteronyssinus');
  assert.equal(matchToken('이소시아네이트 TDI').allergen?.code ?? matchToken('이소시아네이트 TDI').allergen?.name_ko, '이소시아네이트 TDI');
  assert.equal(matchToken('마카다미아너트').allergen?.name_en, 'Macadamia nut');
  assert.equal(matchToken('큰조아재비').allergen?.name_en, 'Timothy grass');
  assert.equal(matchToken('랍스터').allergen?.name_en, 'Lobster');
});

test('matchToken: component antigens', () => {
  assert.equal(matchToken('rDer p 10 (진드기 (Dp))').allergen?.name_en, 'rDer p 10');
  assert.equal(matchToken('rDer f 2 (진드기 (Df))').allergen?.name_en, 'rDer f 2');
  assert.equal(matchToken('nBos d 5 (우유)').allergen?.name_en, 'nBos d 5');
  assert.equal(matchToken('rPhl p 12 (큰조아재비)').allergen?.name_en, 'rPhl p 12');
  assert.equal(matchToken('rAra h 8 (땅콩)').allergen?.name_en, 'rAra h 8');
  assert.equal(matchToken('rBet v 1 (자작나무)').allergen?.name_en, 'rBet v 1');
  assert.equal(matchToken('rBet v 2 (자작나무)').allergen?.name_en, 'rBet v 2');
  assert.equal(matchToken('nAlpha-Gal (소고기)').allergen?.name_en, 'nAlpha-Gal');
  assert.equal(matchToken('rPen a 1 (새우)').allergen?.name_en, 'rPen a 1');
});

test('matchToken tolerates OCR noise', () => {
  assert.equal(matchToken('마카다미아 너트').allergen?.name_en, 'Macadamia nut');
  assert.equal(matchToken('큰조아재비 ').allergen?.name_en, 'Timothy grass');
  assert.equal(matchToken('페니실린G').allergen, null); // 목록에 없음
});

test('splitTokens protects parentheses', () => {
  assert.deepEqual(splitTokens('소고기, rDer p 10 (진드기 (Dp)), 저장 진드기 A, 게'), [
    '소고기',
    'rDer p 10 (진드기 (Dp))',
    '저장 진드기 A',
    '게',
  ]);
});

/** 샘플 결과지 이미지를 흉내 낸 OCR 줄 (좌표는 대략) */
const sample: OcrLine[] = [
  { text: 'IU/mL Class 특이 IgE 항체 농도', x0: 20, y0: 40, x1: 700, y1: 60 },
  { text: '0.00 ~ 0.34 0 없거나 아주 낮음', x0: 20, y0: 70, x1: 300, y1: 90 },
  { text: '소고기, 오징어, 가리비, 올리브, 명아주과풀, 마늘, 마카다미아너트, 큰조아재비,', x0: 320, y0: 95, x1: 760, y1: 110 },
  { text: '0.35 ~ 0.69 1 낮음 호밀꽃가루, nBos d 5 (우유), 페니실린 G, 이소시아네이트 TDI,', x0: 20, y0: 112, x1: 760, y1: 128 },
  { text: '이소시아네이트 MDI', x0: 320, y0: 130, x1: 500, y1: 145 },
  { text: '리조푸스, 닭고기, 대구, 랍스터, 홍합, 굴, 번데기, 플라타너스, 버드나무,', x0: 320, y0: 160, x1: 760, y1: 175 },
  { text: '0.70 ~ 3.49 2 보통 미루나무, 물푸레나무, 백송, 삼나무, 돼지풀, 민들레, 창질경이, 명아주,', x0: 20, y0: 178, x1: 760, y1: 194 },
  { text: '갈대, 외겨이삭, 바퀴벌레, 락테스, rPen a 1 (새우), 아목시실린, 세파클러', x0: 320, y0: 196, x1: 760, y1: 210 },
  { text: 'rDer p 10 (진드기 (Dp)), 저장 진드기 A, rAln g 1 (오리나무), 게, 새우, 조개,', x0: 320, y0: 240, x1: 760, y1: 255 },
  { text: '3.50 ~ 17.49 3 보통/조금 높음 rPhl p 12 (큰조아재비), 참나무, 쑥 꽃가루, 샐러리, 옥수수, 아몬드,', x0: 20, y0: 258, x1: 760, y1: 274 },
  { text: 'rPru p 1 (복숭아), nAlpha-Gal (소고기)', x0: 320, y0: 276, x1: 700, y1: 290 },
  { text: '17.50 ~ 49.99 4 조금 높음 저장 진드기 T, rQue a 1 (참나무), 복숭아, rAra h 8 (땅콩), rPru p 4 (복숭아)', x0: 20, y0: 300, x1: 760, y1: 316 },
  { text: '50.00 ~ 99.99 5 높음 집먼지, 진드기 Dp, rBet v 1 (자작나무), rBet v 2 (자작나무), 개암나무', x0: 20, y0: 325, x1: 760, y1: 340 },
  { text: '≥100.00 6 매우 높음 진드기 Df, rDer f 2 (진드기 (Df)), 오리나무, 자작나무', x0: 20, y0: 350, x1: 760, y1: 366 },
  { text: '총 IgE', x0: 20, y0: 400, x1: 100, y1: 415 },
  { text: 'IU/mL Interpretation 결과 임상적 의의', x0: 20, y0: 420, x1: 700, y1: 435 },
  { text: '≤100 정상치 1224 총 IgE가 증가되어 있습니다.', x0: 20, y0: 440, x1: 700, y1: 455 },
];

test('parseLines assigns wrapped lines to the nearest class row', () => {
  const r = parseLines(sample);
  assert.equal(r.totalIgE, 1224);
  const byRaw = new Map(r.findings.map((f) => [f.raw, f]));
  assert.equal(byRaw.get('소고기')?.cls, 1);
  assert.equal(byRaw.get('이소시아네이트 MDI')?.cls, 1);
  assert.equal(byRaw.get('리조푸스')?.cls, 2);
  assert.equal(byRaw.get('세파클러')?.cls, 2);
  assert.equal(byRaw.get('rDer p 10 (진드기 (Dp))')?.cls, 3);
  assert.equal(byRaw.get('nAlpha-Gal (소고기)')?.cls, 3);
  assert.equal(byRaw.get('자작나무')?.cls, 6);
  assert.equal(byRaw.get('rBet v 1 (자작나무)')?.no, 40);
  // 목록에 없는 항목은 no=null
  assert.equal(byRaw.get('아목시실린')?.no, null);
  assert.equal(byRaw.get('페니실린 G')?.no, null);
});

test('summarize dedupes families and keeps max class', () => {
  const r = parseLines(sample);
  const s = summarize(r.findings);
  const mite = s.find((x) => x.family === '집먼지진드기');
  assert.ok(mite);
  assert.equal(mite!.cls, 6);
  assert.ok(mite!.members.length >= 3);
  const birch = s.find((x) => x.family === '자작나무');
  assert.equal(birch!.cls, 6);
  // 소고기(1) + nAlpha-Gal(3) → 소고기 3
  assert.equal(s.find((x) => x.family === '소고기')!.cls, 3);
  const b = bucket(s);
  assert.ok(b.spring.some((x) => x.family === '오리나무'));
  assert.ok(b.autumn.some((x) => x.family === '쑥'));
  assert.ok(b.summer.some((x) => x.family === '큰조아재비'));
  assert.ok(b.perennial.some((x) => x.family === '바퀴벌레'));
});
