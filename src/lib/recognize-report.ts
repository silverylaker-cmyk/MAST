import { antigenColumnX, clipLeft, mergeParsed, parseLines, type OcrLine, type ParsedReport } from './parse';

type Recognize = (image: string, progress?: (message: string) => void, scale?: number, cropX?: number,
  threshold?: number) => Promise<{ lines: OcrLine[]; separators: number[] }>;

/** 추가 판독이 실패해도 이미 읽은 결과는 보존한다. */
export async function recognizeReport(image: string, recognize: Recognize,
  progress: (message: string) => void, single = false): Promise<ParsedReport> {
  let result: ParsedReport = { findings: [], totalIgE: null, rows: [] };
  const failures: string[] = [];
  let successfulPasses = 0;
  async function attempt(label: string, run: () => Promise<ParsedReport>, preferred = false) {
    progress(label);
    try {
      const next = await run();
      successfulPasses++;
      result = preferred && next.rows.length ? mergeParsed(next, result) : mergeParsed(result, next);
    } catch {
      failures.push(label.replace(' 중…', ''));
    }
  }
  let first: Awaited<ReturnType<Recognize>> | undefined;
  await attempt('기본 판독 중…', async () => {
    first = await recognize(image, progress);
    return parseLines(first.lines, first.separators);
  }, true);
  const colX = first && antigenColumnX(first.lines);
  if (first && colX) {
    const source = first;
    await attempt('항원명 열 판독 중…', async () => {
      const column = await recognize(image, undefined, undefined, colX);
      return parseLines([...clipLeft(source.lines, colX), ...column.lines], source.separators);
    }, true);
  }
  if (!single) {
    await attempt('확대 판독 중…', async () => {
      const pass = await recognize(image, undefined, 4);
      return parseLines(pass.lines, pass.separators);
    }, result.rows.length === 0);
    if (!result.findings.some((f) => f.no !== null) || result.findings.some((f) => f.no === null || f.score < 0.8)) {
      await attempt('대비를 조정하여 재판독 중…', async () => {
        const pass = await recognize(image, undefined, 3, 0, -2);
        return parseLines(pass.lines, pass.separators);
      }, result.rows.length === 0);
    }
  }
  if (!successfulPasses) throw new Error('이미지를 읽지 못했습니다. 다시 시도하거나 다른 캡처를 선택해 주세요.');
  if (failures.length) result.warnings = [...(result.warnings ?? []), `${failures.join(', ')}에 실패하여 성공한 판독 결과를 표시합니다.`];
  return result;
}
