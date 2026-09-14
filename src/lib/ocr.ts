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
/** 실험용: ?scale=3&thr=160&pixel=1 로 전처리 설정을 바꿀 수 있다 (thr: -1 회색조, -2 Otsu) */
function tuning(scaleOverride?: number) {
  const q = new URLSearchParams(location.search);
  return {
    scale: scaleOverride ?? Number(q.get('scale') ?? 3),
    thr: Number(q.get('thr') ?? -1),
    pixelated: q.get('pixel') === '1',
  };
}

/** Otsu 자동 이진화 임계값 */
function otsu(gray: Uint8Array): number {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; thr = i; }
  }
  return thr;
}

async function upscale(
  dataUrl: string,
  scaleOverride?: number,
  cropX = 0,
): Promise<{ canvas: HTMLCanvasElement; separators: number[]; dx: number }> {
  const { scale, thr, pixelated } = tuning(scaleOverride);
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
  const exact = new Float32Array(c.width * c.height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    exact[j] = g;
    gray[j] = g;
  }
  // thr < 0 이면 회색조 그대로(-1) 또는 Otsu 자동 임계값(-2)
  const t = thr === -2 ? otsu(gray) : thr;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = exact[j];
    const v = thr === -1 ? g : g > t ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(im, 0, 0);
  // 이진화 전 회색조에서 표의 가로 구분선을 찾는다 (연한 선도 잡힘)
  const separators = findSeparators(gray, c.width, c.height);
  if (cropX > 0 && cropX < c.width - 40) {
    // 항원명 열만 잘라 낸다 (열이 좁아지면 줄 나눔이 정확해져 인식률이 크게 오른다)
    const cut = document.createElement('canvas');
    cut.width = c.width - cropX;
    cut.height = c.height;
    cut.getContext('2d')!.drawImage(c, -cropX, 0);
    return { canvas: cut, separators, dx: cropX };
  }
  return { canvas: c, separators, dx: 0 };
}

export async function recognizeLines(
  dataUrl: string,
  onProgress?: (msg: string) => void,
  scale?: number,
  /** 이 x 좌표(확대 후 캔버스 기준) 오른쪽만 판독한다. 좌표는 원래대로 되돌려 준다 */
  cropX = 0,
): Promise<{ lines: OcrLine[]; separators: number[] }> {
  onProgress?.('OCR 엔진 준비 중…');
  const worker = await getWorker();
  onProgress?.('이미지 전처리 중…');
  const { canvas, separators, dx } = await upscale(dataUrl, scale, cropX);
  onProgress?.('글자 인식 중… (첫 실행은 언어 데이터 다운로드로 20~30초 걸릴 수 있습니다)');
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        lines.push({
          text: line.text,
          x0: line.bbox.x0 + dx,
          y0: line.bbox.y0,
          x1: line.bbox.x1 + dx,
          y1: line.bbox.y1,
          words: line.words.map((w) => ({ text: w.text, x0: w.bbox.x0 + dx, y0: w.bbox.y0, x1: w.bbox.x1 + dx, y1: w.bbox.y1 })),
        });
      }
    }
  }
  return { lines, separators };
}
