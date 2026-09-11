/**
 * 표의 가로 구분선 y 좌표를 찾는다.
 * gray: 회색조 픽셀(0~255), 행 우선. 한 스캔라인의 80% 이상이 흰색이 아니면 구분선 후보.
 */
export function findSeparators(gray: Uint8Array, w: number, h: number, opts = { ink: 235, cover: 0.8 }): number[] {
  const rows: number[] = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    const off = y * w;
    for (let x = 0; x < w; x++) if (gray[off + x] < opts.ink) n++;
    if (n >= w * opts.cover) rows.push(y);
  }
  // 연속된 y는 하나로 (두꺼운 선·상단 바)
  const out: number[] = [];
  let start = -1;
  let prev = -10;
  for (const y of rows) {
    if (y !== prev + 1) {
      if (start >= 0) out.push((start + prev) / 2);
      start = y;
    }
    prev = y;
  }
  if (start >= 0) out.push((start + prev) / 2);
  return out;
}
