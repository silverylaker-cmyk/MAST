import type { FamilyResult } from './types';

/** 병원 차트에 붙여넣을 텍스트: "MAST(YYYY-MM-DD) : 총IgE N" + Class 높은 순 나열 */
export function chartText(fams: FamilyResult[], totalIgE: number | null, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const head = `MAST(${y}-${m}-${d}) : 총IgE ${totalIgE ?? '-'}`;
  const byClass = new Map<number, string[]>();
  for (const f of [...fams].sort((a, b) => b.cls - a.cls)) {
    if (!byClass.has(f.cls)) byClass.set(f.cls, []);
    byClass.get(f.cls)!.push(f.family);
  }
  const lines = [...byClass.entries()].sort((a, b) => b[0] - a[0]).map(([cls, names]) => `Class ${cls}: ${names.join(', ')}`);
  if (!lines.length) lines.push('양성 항원 없음');
  return [head, ...lines].join('\n');
}
