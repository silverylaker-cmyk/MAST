import { createContext, useContext } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

/** 진행도 함수: delay 프레임 뒤 dur 프레임 동안 0→1 */
type Reveal = (delay: number, dur?: number) => number;

const AnimContext = createContext<Reveal | null>(null);

/** Remotion Player 안에서 사용: 현재 프레임 기준 진행도 */
export function RemotionAnim({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const reveal: Reveal = (delay, dur = 18) =>
    interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AnimContext.Provider value={reveal}>{children}</AnimContext.Provider>;
}

/** 인쇄용: 항상 완료 상태 */
export function StaticAnim({ children }: { children: React.ReactNode }) {
  return <AnimContext.Provider value={() => 1}>{children}</AnimContext.Provider>;
}

export function useReveal(): Reveal {
  const r = useContext(AnimContext);
  if (!r) throw new Error('AnimContext missing');
  return r;
}

/** 이징 */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 아래에서 올라오며 나타나는 스타일 */
export function useRise(delay: number, dur = 18, dist = 40): React.CSSProperties {
  const t = easeOut(useReveal()(delay, dur));
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
}
