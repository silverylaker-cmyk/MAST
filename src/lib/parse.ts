import { matchToken, segmentToken } from './match';
import type { Finding } from './types';

/** OCR 결과 한 줄 (위치 포함) */
export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface OcrLine extends OcrWord {
  /** 단어 단위 좌표 (있으면 앵커 위치를 정확히 잡는 데 쓴다) */
  words?: OcrWord[];
}

/** 결과지의 "IU/mL 범위 + Class" 앵커 행: 0.35 ~ 0.69  1  낮음 ... / ≥100.00  6  매우 높음 ... */
/** IU/mL 범위 하한값(숫자만) → Class. OCR이 소수점을 빠뜨려도 잡히게 숫자 문자열로 비교한다 */
const LOWER_BOUND_CLASS: Record<string, number> = {
  '000': 0,
  '035': 1,
  '070': 2,
  '350': 3,
  '1750': 4,
  '5000': 5,
};
const LABEL_CLASS: [RegExp, number][] = [
  [/없거나/, 0],
  [/매우\s*높음/, 6],
  [/보통\s*\/?\s*조금/, 3],
  [/조금\s*높음/, 4],
  [/낮음/, 1],
  [/보통/, 2],
  [/높음/, 5],
];
const RANGE = /(\d[\d.,]*)\s*[~～\-–]\s*(\d[\d.,]*)/;
const GE = /[≥>=]{1,2}\s*(\d[\d.,]*)/;

interface AnchorMatch {
  cls: number;
  /** 앵커(범위+Class 숫자)가 끝나는 문자 위치 */
  end: number;
}

/** 앵커 행 판정: "0.35 ~ 0.69  1  낮음 …" / "350~1749 3 …" / "≥100.00 6 매우 높음 …" / "0.70 ~3.49 > 보통 …" */
function detectAnchor(text: string): AnchorMatch | null {
  let m = RANGE.exec(text);
  let byBound: number | null = null;
  if (m) {
    const lo = m[1].replace(/\D/g, '');
    byBound = LOWER_BOUND_CLASS[lo] ?? null;
  } else {
    m = GE.exec(text);
    if (!m) return null;
    byBound = m[1].replace(/\D/g, '').startsWith('100') ? 6 : null;
  }
  let end = m.index + m[0].length;
  // 범위 뒤에 붙은 Class 숫자(또는 오인식된 기호 한 글자)
  const after = /^\s*[|]?\s*([0-6>])(?![\d.,])/.exec(text.slice(end));
  let byDigit: number | null = null;
  if (after) {
    if (/[0-6]/.test(after[1])) byDigit = Number(after[1]);
    end += after[0].length;
  }
  let byLabel: number | null = null;
  const tail = text.slice(end, end + 20);
  for (const [re, c] of LABEL_CLASS) {
    if (re.test(tail)) {
      byLabel = c;
      break;
    }
  }
  const cls = byBound ?? byDigit ?? byLabel;
  if (cls === null) return null;
  return { cls, end };
}

/** 총 IgE 구간 시작을 알리는 표식 (OCR이 "총"을 "3" 등으로 읽어도 잡히게) */
const TOTAL_MARK = /총\s*IgE|^\S{0,2}\s*IgE\s*$|Interpretation|임상적\s*의의|정상치/i;

/** OCR이 한글을 음절 단위 단어로 쪼갠 경우("명 아 주") 다시 붙인다 */
function joinHangul(s: string): string {
  return s.replace(/(?<=[가-힣])\s+(?=[가-힣])/g, '');
}

/**
 * 총 IgE 값 읽기. "결과" 열(헤더 단어 위치) 아래에 있는 숫자 단어를 고른다.
 * "≤100"/">100"이 "3100", "<100" 등으로 읽히므로 위치로 구분한다.
 */
function readTotalIgE(lines: OcrLine[], totalY: number): number | null {
  const section = lines.filter((ln) => ln.y0 >= totalY);
  if (!section.length) return null;
  if (!section.some((ln) => ln.words && ln.words.length)) {
    // 단어 좌표가 없으면: 100이 아닌 첫 정수
    for (const ln of section) {
      const nums = ln.text.match(/(?<![\d.])(\d{1,5})(?![\d.])/g);
      const c = nums?.map(Number).filter((n) => n !== 100);
      if (c && c.length) return c[0];
    }
    return null;
  }
  const width = Math.max(...lines.map((l) => l.x1));
  // "결과" 헤더 단어의 x 범위
  let colX0 = width * 0.2;
  let colX1 = width * 0.45;
  let headerY = -1;
  for (const ln of section) {
    const w = ln.words?.find((x) => /결과/.test(x.text));
    if (w) {
      colX0 = w.x0 - width * 0.06;
      colX1 = w.x1 + width * 0.06;
      headerY = ln.y1;
      break;
    }
    if (/Interpretation|임상적/.test(ln.text)) headerY = ln.y1;
  }
  const cands: { n: number; d: number }[] = [];
  const colC = (colX0 + colX1) / 2;
  for (const ln of section) {
    if (headerY >= 0 && ln.y0 < headerY - 5) continue;
    if (/Interpretation|임상적/.test(ln.text)) continue;
    const words = ln.words && ln.words.length ? ln.words : [{ text: ln.text, x0: ln.x0, y0: ln.y0, x1: ln.x1, y1: ln.y1 }];
    for (let i = 0; i < words.length; i++) {
      const t = words[i].text.replace(/[^\d]/g, '');
      if (!/^\d{1,5}$/.test(t)) continue;
      if (/[≤≥<>=S]/.test(words[i].text)) continue; // ≤100, >100
      if (t === '100' || (t.length === 4 && t.endsWith('100'))) continue; // "3100" = ≤100 오독
      const xc = (words[i].x0 + words[i].x1) / 2;
      if (xc < colX0 || xc > colX1) continue;
      cands.push({ n: Number(t), d: Math.abs(xc - colC) });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.d - b.d);
  return cands[0].n;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

const LABELS = [
  /없거나\s*아주\s*낮음/g,
  /보통\s*\/?\s*조금\s*높음/g,
  /\/?\s*조금\s*높음/g,
  /매우\s*높음/g,
  /낮음/g,
  /보통/g,
  /높음/g,
];

/** 항원명 셀 텍스트를 쉼표 기준으로 토큰화. 괄호 안 쉼표는 보호 */
export function splitTokens(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '（') depth++;
    if (ch === ')' || ch === '）') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === '，' || ch === '、') && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter((s) => s.length >= 1 && /[가-힣A-Za-z]/.test(s));
}

function stripLabel(s: string): string {
  let t = s;
  for (const l of LABELS) t = t.replace(l, ' ');
  return t.replace(/^[\s/|,.:;'"’`]+/, '').replace(/\s+/g, ' ').trim();
}

export interface ParsedReport {
  findings: Finding[];
  totalIgE: number | null;
  /** 판독 과정 로그(디버그용) */
  rows: { cls: number; text: string }[];
}

/**
 * OCR 줄 목록 → Class별 항원 텍스트 → Finding 목록.
 * 앵커 행(범위+Class)의 y 좌표를 기준으로, 항원명 열(x가 큰 쪽)의 줄들을 가장 가까운 앵커에 붙인다.
 */
/**
 * @param separators 표 가로 구분선 y 좌표(있으면 행 경계로 사용, 없으면 앵커 대칭 규칙)
 */
export function parseLines(lines: OcrLine[], separators: number[] = []): ParsedReport {
  const clean = lines
    .map((ln) => ({ ...ln, text: ln.text.replace(/\s+/g, ' ').trim() }))
    .filter((ln) => ln.text);

  // 1) 총 IgE 구간: 표식이 있는 첫 줄부터 아래는 항원 표가 아니다
  const totalMarks = clean.filter((ln) => TOTAL_MARK.test(ln.text));
  const totalY = totalMarks.length ? Math.min(...totalMarks.map((l) => l.y0)) - 5 : Infinity;
  const totalIgE = readTotalIgE(clean, totalY);

  const table = clean.filter((ln) => ln.y0 < totalY);
  const minX = table.length ? Math.min(...table.map((l) => l.x0)) : 0;
  const rows = new Map<number, string[]>();

  const seps = separators.filter((s) => s < totalY).sort((a, b) => a - b);
  if (seps.length >= 3) {
    // 2a) 구분선 사이 띠(band)마다: 앵커로 Class를 정하고, 그 띠의 항원명 줄을 모은다
    const nonAnchor = table.filter((ln) => !(ln.x0 < minX + 120 && detectAnchor(ln.text)));
    const xs = nonAnchor.filter((l) => /^[가-힣A-Za-z]/.test(l.text)).map((l) => l.x0).sort((a, b) => a - b);
    const namesX = xs.length ? xs[Math.floor(xs.length / 2)] : minX + 120;
    const bands: { cls: number; parts: string[] }[] = [];
    for (let i = 0; i + 1 < seps.length; i++) {
      const top = seps[i];
      const bottom = seps[i + 1];
      const inBand = table.filter((ln) => {
        const yc = (ln.y0 + ln.y1) / 2;
        return yc > top && yc < bottom;
      });
      let cls: number | null = null;
      const parts: string[] = [];
      for (const ln of inBand) {
        const m = ln.x0 < minX + 120 ? detectAnchor(ln.text) : null;
        if (m) {
          if (cls === null) cls = m.cls;
          const rest = stripLabel(ln.text.slice(m.end));
          if (rest) parts.push(rest);
          continue;
        }
        if (/특이\s*IgE|IU\/mL|Class|항체/i.test(ln.text)) continue;
        let text = ln.text;
        if (ln.words && ln.words.length) {
          // 항원명 열 왼쪽의 쓰레기 단어는 버리고 나머지만
          text = ln.words.filter((w) => w.x1 >= namesX - 60).map((w) => w.text).join(' ');
        } else if (ln.x0 < namesX - 60) continue;
        text = stripLabel(joinHangul(text));
        if (text && /[가-힣A-Za-z]/.test(text)) parts.push(text);
      }
      if (cls === null) continue;
      bands.push({ cls, parts });
    }
    // 표는 항상 Class 0~6 순서. 읽은 Class가 순서대로 커지지 않으면(오독) 위치 순서로 보정한다
    const increasing = bands.every((b, i) => i === 0 || b.cls > bands[i - 1].cls);
    if (!increasing && bands.length === 7) bands.forEach((b, i) => (b.cls = i));
    for (const b of bands) {
      if (!rows.has(b.cls)) rows.set(b.cls, []);
      rows.get(b.cls)!.push(...b.parts);
    }
    return finish(rows, totalIgE);
  }

  // 2b) 구분선이 없으면: 앵커 행(범위 + Class)을 찾고 대칭 규칙으로 배정
  const anchors: { cls: number; y: number; rest: string }[] = [];
  const others: { text: string; x0: number; yc: number; fromAnchor?: boolean }[] = [];
  const heights: number[] = [];
  for (const ln of table) {
    const m = ln.x0 < minX + 120 ? detectAnchor(ln.text) : null;
    if (m) {
      const restText = ln.text.slice(m.end);
      // 단어 좌표가 있으면 앵커(Class 숫자까지)와 나머지(항원명)를 분리해 각자의 세로 위치를 쓴다
      let y = (ln.y0 + ln.y1) / 2;
      if (ln.words && ln.words.length) {
        // 앵커가 끝나는 문자 위치(m.end)까지 덮는 단어들이 앵커 머리
        let acc = 0;
        let clsIdx = 0;
        for (let i = 0; i < ln.words.length; i++) {
          acc += ln.words[i].text.length + 1;
          clsIdx = i;
          if (acc >= m.end) break;
        }
        const head = ln.words.slice(0, clsIdx + 1);
        y = median(head.map((w) => (w.y0 + w.y1) / 2));
        const restWords = ln.words.slice(clsIdx + 1);
        const restTail = restWords.filter((w) => /[가-힣A-Za-z]/.test(w.text));
        if (restTail.length && stripLabel(restText)) {
          const ry = median(restTail.map((w) => (w.y0 + w.y1) / 2));
          others.push({ text: stripLabel(restText), x0: restTail[0].x0, yc: ry, fromAnchor: true });
          anchors.push({ cls: m.cls, y, rest: '' });
          continue;
        }
      }
      anchors.push({ cls: m.cls, y, rest: stripLabel(restText) });
    } else {
      heights.push(ln.y1 - ln.y0);
      others.push({ text: ln.text, x0: ln.x0, yc: (ln.y0 + ln.y1) / 2 });
    }
  }
  // 같은 Class가 두 번 잡히면 첫 번째만
  const seen = new Set<number>();
  const uniq = anchors.filter((a) => (seen.has(a.cls) ? false : (seen.add(a.cls), true))).sort((a, b) => a.y - b.y);

  for (const a of uniq) rows.set(a.cls, a.rest ? [a.rest] : []);

  if (uniq.length) {
    // 3) 항원명 열의 x 위치: 앵커가 아닌 한글 줄들의 x0 중앙값. 그보다 왼쪽에서 시작하는 줄은 쓰레기/라벨
    const xs = others.filter((l) => !l.fromAnchor && /[가-힣]/.test(l.text)).map((l) => l.x0).sort((a, b) => a - b);
    const namesX = xs.length ? xs[Math.floor(xs.length / 2)] : minX + 120;
    const hs = heights.sort((a, b) => a - b);
    const lineH = hs.length ? hs[Math.floor(hs.length / 2)] : 20;
    const tol = lineH * 0.45;
    const names = others
      .map((l) => ({ ...l, text: stripLabel(l.text) }))
      .filter((l) => l.text && /[가-힣A-Za-z]/.test(l.text))
      .filter((l) => l.fromAnchor || l.x0 >= namesX - 60)
      .filter((l) => !/특이\s*IgE|IU\/mL|Class|항체/i.test(l.text))
      .filter((l) => l.yc >= uniq[0].y - lineH * 6 && l.yc <= uniq[uniq.length - 1].y + lineH * 6)
      .sort((a, b) => a.yc - b.yc);

    // 셀 안에서 항원명 줄은 앵커를 중심으로 위아래 대칭이다:
    // 앵커 위에 n줄이 있으면 아래에도 n줄(중앙에 걸친 줄은 별도)
    let idx = 0;
    for (let k = 0; k < uniq.length; k++) {
      const a = uniq[k];
      const nextY = k + 1 < uniq.length ? uniq[k + 1].y : Infinity;
      const above: string[] = [];
      while (idx < names.length && names[idx].yc < a.y - tol) above.push(names[idx++].text);
      const center: string[] = [];
      while (idx < names.length && Math.abs(names[idx].yc - a.y) <= tol) center.push(names[idx++].text);
      const below: string[] = [];
      while (idx < names.length && below.length < above.length && names[idx].yc < nextY - tol) below.push(names[idx++].text);
      rows.get(a.cls)!.push(...above, ...center, ...below);
    }
    // 마지막 앵커 아래 남은 줄은 마지막 행에
    while (idx < names.length) rows.get(uniq[uniq.length - 1].cls)!.push(names[idx++].text);
  }

  return finish(rows, totalIgE);
}

function finish(rows: Map<number, string[]>, totalIgE: number | null): ParsedReport {
  // 4) 토큰화 + 매칭 (같은 행 안의 중복 토큰 제거)
  const findings: Finding[] = [];
  const rowLog: { cls: number; text: string }[] = [];
  for (const [cls, parts] of rows) {
    const text = parts.join(', ');
    rowLog.push({ cls, text });
    if (cls === 0) continue;
    const seenTok = new Set<string>();
    for (const tok of splitTokens(text)) {
      const key = tok.replace(/\s+/g, '').toLowerCase();
      if (seenTok.has(key)) continue;
      seenTok.add(key);
      const m = matchToken(tok);
      const normLen = tok.replace(/[^가-힣A-Za-z0-9]/g, '').length;
      if (!m.isComponent && (m.score < 0.85 || m.keyLength < normLen * 0.85)) {
        // 쉼표 누락으로 여러 항원이 붙은 토큰이면 쪼개서 각각 넣는다
        const parts = segmentToken(tok);
        if (parts.length >= 2) {
          for (const a of parts) findings.push({ raw: `${tok} → ${a.name_ko}`, cls, no: a.no, score: 0.75 });
          continue;
        }
      }
      findings.push({ raw: tok, cls, no: m.allergen?.no ?? null, score: m.score });
    }
  }
  // 같은 항원이 여러 행에 잡히면(OCR 오류) 높은 Class 하나만 남긴다
  findings.sort((a, b) => b.cls - a.cls || a.raw.localeCompare(b.raw));
  const seenNo = new Set<number>();
  const deduped = findings.filter((f) => {
    if (f.no === null) return true;
    if (seenNo.has(f.no)) return false;
    seenNo.add(f.no);
    return true;
  });
  return { findings: deduped, totalIgE, rows: rowLog.sort((a, b) => a.cls - b.cls) };
}
