import { ALLERGENS } from './allergens';
import type { Allergen } from './types';

/** 비교용 정규화: 공백/구두점 제거, 소문자, 괄호 안 코드 제거 */
export function normalize(s: string): string {
  return s
    .replace(/\([A-Za-z]{1,3}\d{1,3}\)/g, '') // (D1), (F232) 같은 코드. (Dp)/(Df)는 남긴다
    .replace(/[\s()（）\[\]{}'"’`.,·:;/_\-‐–—~]/g, '')
    .toLowerCase();
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  if (s.length < 2) {
    m.set(s, 1);
    return m;
  }
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** Sørensen–Dice 유사도 (bigram) */
export function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const [g, n] of A) inter += Math.min(n, B.get(g) ?? 0);
  const total = [...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0);
  return (2 * inter) / total;
}

interface Key {
  key: string;
  allergen: Allergen;
  /** 성분항원(rXxx x 1)은 영문키가 있어야 정확히 매칭됨 */
  kind: 'ko' | 'en' | 'both';
}

let keys: Key[] | null = null;

function buildKeys(): Key[] {
  if (keys) return keys;
  keys = [];
  for (const a of ALLERGENS) {
    const ko = normalize(a.name_ko);
    const en = normalize(a.name_en);
    keys.push({ key: ko, allergen: a, kind: 'ko' });
    keys.push({ key: en, allergen: a, kind: 'en' });
    keys.push({ key: en + ko, allergen: a, kind: 'both' });
    if (a.component) keys.push({ key: en + normalize(a.family), allergen: a, kind: 'both' });
    for (const al of a.aliases ?? []) keys.push({ key: normalize(al), allergen: a, kind: 'ko' });
  }
  return keys;
}

export interface MatchResult {
  allergen: Allergen | null;
  score: number;
  /** 매칭에 쓰인 사전 키 길이 (토큰이 키보다 많이 길면 여러 항원이 붙은 것일 수 있음) */
  keyLength: number;
  /** 성분항원(rXxx x 1) 형태의 토큰인지 */
  isComponent: boolean;
}

/**
 * 결과지 토큰 하나를 마스터 항원에 매칭한다.
 * 토큰 예: "소고기", "rDer p 10 (진드기 (Dp))", "nBos d 5 (우유)", "이소시아네이트 TDI"
 */
export function matchToken(token: string, threshold = 0.6): MatchResult {
  const t = token.trim();
  const fullLen = normalize(t).length;
  // 1) 성분 코드(rDer p 10, nBos d 4, nGluten…)가 보이면 코드로 바로 찾는다. 결과지의 괄호 설명은 기관마다 달라서 믿지 않는다
  const byCode = matchComponentCode(t);
  if (byCode) return { allergen: byCode, score: 1, keyLength: fullLen, isComponent: true };
  let best = matchCore(t, threshold);
  if (best.score >= 0.95) return best;
  // 2) "생쥐/쥐", "땅콩 (Peanut)"처럼 이름이 여러 표기로 적힌 경우: 조각마다 맞춰 보고 가장 좋은 것
  const open = t.search(/[(（]/);
  const junkOuter = open > 0 && !/[가-힣]/.test(t.slice(0, open));
  for (const v of nameVariants(t)) {
    let r = matchCore(v, threshold);
    // "0 ㅁ 8605 0 5 (우유)"처럼 바깥이 깨졌는데 괄호 안 이름으로만 찾은 것은 계열만 맞을 수 있어 확인 표시
    if (r.allergen && junkOuter && !t.startsWith(v)) r = { ...r, score: Math.min(r.score, 0.75) };
    if (r.allergen && r.score > best.score) best = { ...r, keyLength: Math.max(r.keyLength, fullLen), isComponent: best.isComponent };
  }
  return best;
}

/** "A/B", "A (B)" → ["A", "B"]. 괄호가 중첩돼도 바깥 이름과 안쪽 설명으로 나눈다 */
function nameVariants(t: string): string[] {
  const out = new Set<string>();
  const open = t.search(/[(（]/);
  // 바깥이 영문(성분 코드가 깨진 것)이면 괄호 안 이름은 '어느 계열인지'일 뿐이라 쓰지 않는다
  if (open > 0 && !/[A-Za-z]/.test(t.slice(0, open))) {
    out.add(t.slice(0, open));
    const inner = t.slice(open + 1).replace(/[)）]\s*$/, '');
    out.add(inner);
    out.add(inner.replace(/[(（].*$/, ''));
  }
  for (const x of [...out, t]) for (const part of x.split(/[/／]/)) out.add(part);
  return [...out].map((x) => x.trim()).filter((x) => x && x !== t.trim());
}

interface CodeKey {
  prefix: string;
  genus: string;
  species: string;
  num: string;
  allergen: Allergen;
}
let codeKeys: CodeKey[] | null = null;
let wordKeys: { prefix: string; word: string; allergen: Allergen }[] | null = null;

function buildCodeKeys() {
  if (codeKeys && wordKeys) return;
  codeKeys = [];
  wordKeys = [];
  for (const a of ALLERGENS) {
    if (!a.component) continue;
    const m = a.name_en.match(/^([rn])([A-Z][a-z]{2})\s+([a-z])\s+(\d{1,2})$/);
    if (m) codeKeys.push({ prefix: m[1], genus: m[2].toLowerCase(), species: m[3], num: m[4], allergen: a });
    else {
      const w = a.name_en.match(/^([rn])(.+)$/);
      if (w) wordKeys.push({ prefix: w[1], word: w[2].toLowerCase().replace(/[^a-z0-9]/g, ''), allergen: a });
    }
  }
}

/**
 * 성분항원 코드 판독. OCR 오독(nBos 0 4 → d를 0으로, rDerp10 → 띄어쓰기 누락)을 견딘다.
 * 접두(r/n)가 같은 것을 우선하고, 종(species) 글자가 깨졌으면 속(genus)+번호가 하나로 정해질 때만 인정한다.
 */
export function matchComponentCode(token: string): Allergen | null {
  buildCodeKeys();
  const t = token.trim();
  const m = t.match(/(?:^|[^A-Za-z])([rnt])?\s?([A-Z][a-z]{2})\s*([a-zA-Z0-9])\s*(\d{1,2})(?![\d.])/);
  if (m) {
    const prefix = m[1] === 't' ? 'r' : m[1] ?? '';
    const genus = m[2].toLowerCase();
    const species = m[3].toLowerCase();
    const num = m[4];
    const same = codeKeys!.filter((k) => k.genus === genus && k.num === num);
    const exact = same.filter((k) => k.species === species);
    const pool = exact.length ? exact : new Set(same.map((k) => k.species)).size === 1 ? same : [];
    if (pool.length) return (pool.find((k) => k.prefix === prefix) ?? pool[0]).allergen;
  }
  // nGluten / rGluten / nGliadin / nAlpha-Gal 같은 단어형 성분명
  const w = t.match(/^([rn])?\s?([A-Z][A-Za-z0-9-]{3,})/);
  if (w) {
    const prefix = w[1] ?? '';
    const word = w[2].toLowerCase().replace(/[^a-z0-9]/g, '');
    const hit = wordKeys!.filter((k) => k.word === word);
    if (hit.length) return (hit.find((k) => k.prefix === prefix) ?? hit[0]).allergen;
  }
  return null;
}

function matchCore(token: string, threshold: number): MatchResult {
  const t = token.trim();
  if (!t) return { allergen: null, score: 0, keyLength: 0, isComponent: false };

  const isComponent = /^[rn][A-Z][A-Za-z-]+/.test(t);
  const norm = normalize(t);
  if (!norm) return { allergen: null, score: 0, keyLength: 0, isComponent };
  // 한 글자짜리(OCR 파편)는 정확히 일치할 때만
  const hangulLen = (norm.match(/[가-힣]/g) ?? []).length;
  const exactOnly = norm.length <= 1 || (hangulLen <= 1 && !/[A-Za-z]{3,}/.test(norm));

  let best: MatchResult = { allergen: null, score: 0, keyLength: 0, isComponent };
  for (const k of buildKeys()) {
    // 성분항원 토큰은 영문 성분명이 포함된 키(en/both)로만, 일반 토큰은 한글 키 우선
    if (isComponent && k.kind === 'ko') continue;
    if (!isComponent && k.allergen.component && k.kind === 'ko') continue;
    if (exactOnly) {
      if (norm === k.key) return { allergen: k.allergen, score: 1, keyLength: k.key.length, isComponent };
      continue;
    }
    let s = dice(norm, k.key);
    // 한쪽이 다른 쪽을 통째로 포함하고 길이도 비슷하면 가산
    const shorter = Math.min(norm.length, k.key.length);
    const longer = Math.max(norm.length, k.key.length);
    if (shorter >= 2 && shorter / longer >= 0.65 && (k.key.includes(norm) || norm.includes(k.key))) s = Math.max(s, 0.9);
    if (s > best.score) best = { allergen: k.allergen, score: s, keyLength: k.key.length, isComponent };
  }
  if (best.score < threshold) return { ...best, allergen: null };
  return best;
}

/** 쉼표가 빠져 여러 항원이 한 토큰에 붙은 경우("저장 진드기 T 조개") 사전으로 쪼갠다. 2개 이상 찾을 때만 */
let segKeys: { key: string; allergen: Allergen }[] | null = null;
export function segmentToken(token: string): Allergen[] {
  if (!segKeys) {
    segKeys = [];
    for (const a of ALLERGENS) {
      for (const name of [a.name_ko, ...(a.aliases ?? [])]) {
        const k = normalize(name);
        // '진드기' 같은 포괄 명칭은 다른 이름의 일부로 자주 나오므로 분절 사전에서 제외
        if (k.length >= 1 && /[가-힣]/.test(k) && k !== '진드기') segKeys.push({ key: k, allergen: a });
      }
    }
    segKeys.sort((p, q) => q.key.length - p.key.length);
  }
  const norm = normalize(token);
  const taken: boolean[] = new Array(norm.length).fill(false);
  const found: { at: number; allergen: Allergen }[] = [];
  for (const { key, allergen } of segKeys) {
    let from = 0;
    while (true) {
      const at = norm.indexOf(key, from);
      if (at < 0) break;
      const free = !taken.slice(at, at + key.length).some(Boolean);
      // 한 글자 이름(쌀·굴·게·콩…)은 남은 조각 전체와 딱 맞을 때만 (다른 이름의 일부일 수 있음)
      const whole = key.length > 1 || ((at === 0 || taken[at - 1]) && (at + 1 >= norm.length || taken[at + 1]));
      if (free && whole) {
        for (let i = at; i < at + key.length; i++) taken[i] = true;
        found.push({ at, allergen });
      }
      from = at + 1;
    }
  }
  if (found.length === 0) return [];
  // 사전에 없는 나머지 조각은 퍼지 매칭으로 (OCR 오타 "저장 진드기 ㅠ" 등)
  let i = 0;
  while (i < norm.length) {
    if (taken[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < norm.length && !taken[j]) j++;
    const chunk = norm.slice(i, j);
    if (chunk.length >= 3) {
      const r = matchToken(chunk, 0.7);
      if (r.allergen && !found.some((f) => f.allergen === r.allergen)) found.push({ at: i, allergen: r.allergen });
    }
    i = j;
  }
  if (found.length < 2) return [];
  return found.sort((p, q) => p.at - q.at).map((f) => f.allergen);
}
