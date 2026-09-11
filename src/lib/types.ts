export type Group = 'perennial' | 'seasonal' | 'food' | 'other';
export type Season = 'spring' | 'summer' | 'autumn' | null;

export interface Allergen {
  no: number;
  category: string;
  name_en: string;
  name_ko: string;
  code: string | null;
  group: Group;
  season: Season;
  component: boolean;
  cross_reactive: boolean;
  family: string;
  aliases: string[];
  sample_class: number | null;
}

/** 판독 결과 한 줄: 결과지에서 읽은 항원 하나 */
export interface Finding {
  /** 결과지에 적힌 원문 토큰 */
  raw: string;
  cls: number;
  /** 매칭된 마스터 항원 번호 (없으면 null) */
  no: number | null;
  /** 매칭 신뢰도 0~1 */
  score: number;
}

/** 슬라이드에 표시되는 항원 묶음 (family 단위) */
export interface FamilyResult {
  family: string;
  group: Group;
  season: Season;
  cls: number;
  cross_reactive: boolean;
  members: Allergen[];
}

export interface PatientReport {
  patientLabel: string;
  totalIgE: number | null;
  findings: Finding[];
  imageDataUrl: string | null;
  createdAt: string;
}
