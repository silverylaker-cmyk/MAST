import { createWorker } from 'tesseract.js';
import type { OcrLine } from './parse';
import { findSeparators } from './separators';

let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    const base = `${location.origin}${import.meta.env.BASE_URL}tess`;
    workerPromise = createWorker('kor+eng', 1, {
      workerPath: `${base}/worker.min.js`,
      corePath: base,
      langPath: base,
      gzip: false,
      logger: () => {},
    });
  }
  return workerPromise;
}

/** 이미지를 3배로 키우고 이진화해 OCR 인식률을 높인다 (화면 캡처는 글자가 작음) */
/** 실험용: ?scale=3&thr=160&pixel=1 로 전처리 설정을 바꿀 수 있다 */
function tuning() {
  const q = new URLSearchParams(location.search);
  return {
    scale: Number(q.get('scale') ?? 3),
    thr: Number(q.get('thr') ?? 160),
    pixelated: q.get('pixel') === '1',
  };
}

async function upscale(dataUrl: string): Promise<{ canvas: HTMLCanvasElement; separators: number[] }> {
  const { scale, thr, pixelated } = tuning();
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  const ctx = c.getContext('2d')!;
  if (pixelated) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, c.width, c.height);
  } else {
    // createImageBitmap의 고품질 리사이즈(Lanczos 계열)가 canvas smoothing보다 글자가 또렷하다
    const bmp = await createImageBitmap(img, { resizeWidth: c.width, resizeHeight: c.height, resizeQuality: 'high' });
    ctx.drawImage(bmp, 0, 0);
  }
  // 대비 강화 (흑백)
  const im = ctx.getImageData(0, 0, c.width, c.height);
  const d = im.data;
  const gray = new Uint8Array(c.width * c.height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    gray[j] = g;
    const v = g > thr ? 255 : 0; // 이진화 — 화면 캡처는 배경이 밝아 단순 임계값이 가장 잘 맞았다
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(im, 0, 0);
  // 이진화 전 회색조에서 표의 가로 구분선을 찾는다 (연한 선도 잡힘)
  const separators = findSeparators(gray, c.width, c.height);
  return { canvas: c, separators };
}

export async function recognizeLines(
  dataUrl: string,
  onProgress?: (msg: string) => void,
): Promise<{ lines: OcrLine[]; separators: number[] }> {
  onProgress?.('OCR 엔진 준비 중…');
  const worker = await getWorker();
  onProgress?.('이미지 전처리 중…');
  const { canvas, separators } = await upscale(dataUrl);
  onProgress?.('글자 인식 중… (첫 실행은 언어 데이터 다운로드로 20~30초 걸릴 수 있습니다)');
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        lines.push({
          text: line.text,
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1,
          words: line.words.map((w) => ({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 })),
        });
      }
    }
  }
  return { lines, separators };
}
