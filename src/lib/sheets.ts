import { config } from '../config';
import { byNo } from './allergens';
import { summarize } from './classify';
import type { PatientReport } from './types';

/** 구글 시트(Apps Script 웹앱)에 결과 저장. URL이 없으면 건너뜀. */
export async function saveToSheet(report: PatientReport): Promise<'saved' | 'skipped' | 'error'> {
  if (!config.sheetsWebAppUrl) return 'skipped';
  const fams = summarize(report.findings);
  const payload = {
    createdAt: report.createdAt,
    patient: report.patientLabel,
    totalIgE: report.totalIgE,
    positives: fams.map((f) => `${f.family}(${f.cls})`).join(', '),
    raw: report.findings
      .map((f) => `${f.raw}=${f.cls}${f.no ? `#${byNo.get(f.no)!.name_en}` : '?'}`)
      .join('; '),
  };
  try {
    // text/plain + no-cors 로 보내면 CORS preflight 없이 Apps Script가 받는다
    await fetch(config.sheetsWebAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return 'saved';
  } catch {
    return 'error';
  }
}
