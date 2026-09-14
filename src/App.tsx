import { useMemo, useState } from 'react';
import { PasteInput } from './components/PasteInput';
import { Review } from './components/Review';
import { SlideShow } from './components/SlideShow';
import { recognizeLines } from './lib/ocr';
import { parseLines, mergeParsed, antigenColumnX, clipLeft } from './lib/parse';
import { bucket, summarize } from './lib/classify';
import { saveToSheet } from './lib/sheets';
import type { Finding } from './lib/types';
import type { SlideData } from './slides/slides';

type Stage = 'input' | 'ocr' | 'review' | 'show';

export default function App() {
  const [stage, setStage] = useState<Stage>('input');
  const [image, setImage] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [totalIgE, setTotalIgE] = useState<number | null>(null);
  const [patient, setPatient] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');

  async function onImage(dataUrl: string) {
    setImage(dataUrl);
    setStage('ocr');
    setError('');
    try {
      const debug = location.search.includes('debug');
      const single = new URLSearchParams(location.search).has('scale');
      const a = await recognizeLines(dataUrl, setProgress);
      if (debug) (window as unknown as { __ocrLines: unknown }).__ocrLines = a.lines;
      let r = parseLines(a.lines, a.separators);
      // 2차: 항원명 열만 잘라서 다시 판독한다. 열이 좁으면 줄 나눔이 정확해져
      // 여러 줄에 걸친 칸(Class 3 등)도 제대로 읽힌다.
      const colX = antigenColumnX(a.lines);
      if (colX) {
        setProgress('항원명 열 판독 중…');
        const c = await recognizeLines(dataUrl, undefined, undefined, colX);
        if (debug) (window as unknown as { __colLines: unknown }).__colLines = c.lines;
        const merged = [...clipLeft(a.lines, colX), ...c.lines];
        r = mergeParsed(parseLines(merged, a.separators), r);
      }
      // 짧은 항원명은 확대 배율에 따라 읽히기도, 안 읽히기도 해서 다른 배율로도 판독해 합친다
      if (!single) {
        setProgress('2차 판독 중…');
        const b = await recognizeLines(dataUrl, undefined, 4);
        r = mergeParsed(r, parseLines(b.lines, b.separators));
      }
      setFindings(r.findings);
      setTotalIgE(r.totalIgE);
      if (r.findings.length === 0) setError('항원을 읽지 못했습니다. 「특이 IgE 항체 결과」 표가 선명하게 보이도록 다시 캡처하거나, 아래에서 직접 추가하세요.');
      setStage('review');
    } catch (e) {
      setError(`판독 중 오류: ${(e as Error).message}`);
      setFindings([]);
      setStage('review');
    }
  }

  const slideData: SlideData = useMemo(() => {
    const results = summarize(findings);
    return { patientLabel: patient.trim(), totalIgE, results, buckets: bucket(results), imageDataUrl: image };
  }, [findings, patient, totalIgE, image]);

  async function confirm() {
    setStage('show');
    setSaveStatus('저장 중…');
    const s = await saveToSheet({
      patientLabel: patient.trim(),
      totalIgE,
      findings,
      imageDataUrl: null,
      createdAt: new Date().toISOString(),
    });
    setSaveStatus(s === 'saved' ? '구글 시트 저장됨' : s === 'skipped' ? '' : '시트 저장 실패');
  }

  if (stage === 'show') return <SlideShow data={slideData} onExit={() => setStage('review')} saveStatus={saveStatus} />;

  return (
    <div className="app">
      <header>
        <h1>알레르기 비염 · MAST 결과 설명 슬라이드</h1>
      </header>
      {stage === 'input' && <PasteInput onImage={onImage} />}
      {stage === 'ocr' && (
        <div className="ocr-wait">
          <img src={image!} alt="" />
          <div className="spinner" />
          <p>{progress}</p>
        </div>
      )}
      {stage === 'review' && image && (
        <>
          {error && <div className="warn">{error}</div>}
          <Review
            image={image}
            findings={findings}
            totalIgE={totalIgE}
            patientLabel={patient}
            onChange={setFindings}
            onPatient={setPatient}
            onTotalIgE={setTotalIgE}
            onConfirm={confirm}
            onBack={() => setStage('input')}
          />
        </>
      )}
    </div>
  );
}
