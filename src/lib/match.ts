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
}

/**
 * 결과지 토큰 하나를 마스터 항원에 매칭한다.
 * 토큰 예: "소고기", "rDer p 10 (진드기 (Dp))", "nBos d 5 (우유)", "이소시아네이트 TDI"
 */
export function matchToken(token: string, threshold = 0.6): MatchResult {
  const t = token.trim();
  if (!t) return { allergen: null, score: 0 };

  const isComponent = /^[rn][A-Z][A-Za-z-]+/.test(t);
  const norm = normalize(t);
  if (!norm) return { allergen: null, score: 0 };
  // 한 글자짜리(OCR 파편)는 정확히 일치할 때만
  const hangulLen = (norm.match(/[가-힣]/g) ?? []).length;
  const exactOnly = norm.length <= 1 || (hangulLen <= 1 && !/[A-Za-z]{3,}/.test(norm));

  let best: MatchResult = { allergen: null, score: 0 };
  for (const k of buildKeys()) {
    // 성분항원 토큰은 영문 성분명이 포함된 키(en/both)로만, 일반 토큰은 한글 키 우선
    if (isComponent && k.kind === 'ko') continue;
    if (!isComponent && k.allergen.component && k.kind === 'ko') continue;
    if (exactOnly) {
      if (norm === k.key) return { allergen: k.allergen, score: 1 };
      continue;
    }
    let s = dice(norm, k.key);
    // 한쪽이 다른 쪽을 통째로 포함하고 길이도 비슷하면 가산
    const shorter = Math.min(norm.length, k.key.length);
    const longer = Math.max(norm.length, k.key.length);
    if (shorter >= 2 && shorter / longer >= 0.5 && (k.key.includes(norm) || norm.includes(k.key))) s = Math.max(s, 0.9);
    if (s > best.score) best = { allergen: k.allergen, score: s };
  }
  if (best.score < threshold) return { allergen: null, score: best.score };
  return best;
}
