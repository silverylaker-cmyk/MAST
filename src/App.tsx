import { useMemo, useState } from 'react';
import { PasteInput } from './components/PasteInput';
import { Review } from './components/Review';
import { SlideShow } from './components/SlideShow';
import { recognizeLines } from './lib/ocr';
import { parseLines } from './lib/parse';
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
      const { lines, separators } = await recognizeLines(dataUrl, setProgress);
      const r = parseLines(lines, separators);
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
