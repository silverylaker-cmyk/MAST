import { byNo } from './allergens';
import { config } from '../config';
import type { Allergen, FamilyResult, Finding, Group, Season } from './types';

/** Finding 목록 → family 단위로 중복 제거한 양성 항원 묶음 (Class 최고값) */
export function summarize(findings: Finding[]): FamilyResult[] {
  const map = new Map<string, FamilyResult>();
  for (const f of findings) {
    if (f.no === null || f.cls < config.positiveMinClass) continue;
    const a = byNo.get(f.no)!;
    const key = `${a.group}:${a.season ?? ''}:${a.family}`;
    const cur = map.get(key);
    if (cur) {
      cur.cls = Math.max(cur.cls, f.cls);
      cur.cross_reactive ||= a.cross_reactive;
      if (!cur.members.includes(a)) cur.members.push(a);
    } else {
      map.set(key, {
        family: a.family,
        group: a.group,
        season: a.season,
        cls: f.cls,
        cross_reactive: a.cross_reactive,
        members: [a],
      });
    }
  }
  return [...map.values()].sort((p, q) => q.cls - p.cls || p.family.localeCompare(q.family, 'ko'));
}

export interface Buckets {
  perennial: FamilyResult[];
  spring: FamilyResult[];
  summer: FamilyResult[];
  autumn: FamilyResult[];
  food: FamilyResult[];
  other: FamilyResult[];
}

export function bucket(results: FamilyResult[]): Buckets {
  const b: Buckets = { perennial: [], spring: [], summer: [], autumn: [], food: [], other: [] };
  for (const r of results) {
    if (r.group === 'seasonal' && r.season) b[r.season].push(r);
    else if (r.group === 'seasonal') b.spring.push(r);
    else b[r.group].push(r);
  }
  return b;
}

export const GROUP_LABEL: Record<Group, string> = {
  perennial: '통년성',
  seasonal: '계절성',
  food: '음식·교차반응',
  other: '기타',
};
export const SEASON_LABEL: Record<Exclude<Season, null>, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
};

/** 자작나무 계열(PR-10) 교차반응이 의심되는지: 자작나무/오리나무/개암 양성 + 관련 음식 양성 */
export function birchCrossReaction(results: FamilyResult[]): { pollen: FamilyResult[]; foods: FamilyResult[] } {
  const pollenFam = new Set(['자작나무', '오리나무', '개암나무']);
  const foodFam = new Set(['사과', '복숭아', '헤이즐넛', '땅콩', '콩', '샐러리', '당근', '키위', '체리', '아몬드']);
  const pollen = results.filter((r) => r.group === 'seasonal' && pollenFam.has(r.family));
  const foods = pollen.length ? results.filter((r) => r.group === 'food' && foodFam.has(r.family)) : [];
  return { pollen, foods };
}

export function membersLabel(r: FamilyResult): string {
  const comps = r.members.filter((m: Allergen) => m.component).map((m) => m.name_en);
  return comps.length ? comps.join(', ') : '';
}
