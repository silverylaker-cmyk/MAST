import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { RemotionAnim, StaticAnim } from '../slides/anim';
import { buildSlides, type SlideData } from '../slides/slides';
import { W, H, FPS } from '../slides/theme';

interface Props {
  data: SlideData;
  onExit: () => void;
  saveStatus: string;
}

function SlideComp({ data, index }: { data: SlideData; index: number }) {
  const slides = useMemo(() => buildSlides(data), [data]);
  return <RemotionAnim>{slides[index].render(data)}</RemotionAnim>;
}

export function SlideShow({ data, onExit, saveStatus }: Props) {
  const [i, setI] = useState(0);
  const [printing, setPrinting] = useState(false);
  const ref = useRef<PlayerRef>(null);
  const slides = useMemo(() => buildSlides(data), [data]);
  const n = slides.length;

  const next = useCallback(() => setI((x) => Math.min(n - 1, x + 1)), [n]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onExit]);

  // 재생이 끝나면 마지막 프레임에 고정 (Player 기본 동작은 처음으로 되감기)
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    let done = false;
    const onEnded = () => {
      if (done) return; // seekTo가 다시 ended를 일으키므로 한 번만
      done = true;
      p.pause();
      p.seekTo(slides[i].frames - 1);
    };
    p.addEventListener('ended', onEnded);
    return () => p.removeEventListener('ended', onEnded);
  }, [i, slides]);

  useEffect(() => {
    if (!printing) return;
    const after = () => setPrinting(false);
    window.addEventListener('afterprint', after);
    const t = setTimeout(() => window.print(), 300);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', after);
    };
  }, [printing]);

  const inputProps = useMemo(() => ({ data, index: i }), [data, i]);

  if (printing) {
    return (
      <div className="print-root">
        {slides.map((s, k) => (
          <div className="print-page" key={s.key}>
            <div className="print-scale">
              <StaticAnim>{slides[k].render(data)}</StaticAnim>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="show" onClick={next}>
      <div className="show-top" onClick={(e) => e.stopPropagation()}>
        <span className="counter">
          {i + 1} / {n} · {slides[i].title}
        </span>
        <span className="save">{saveStatus}</span>
        <button onClick={prev} disabled={i === 0} title="이전 (←)">
          ‹ 이전
        </button>
        <button onClick={next} disabled={i === n - 1} title="다음 (→)">
          다음 ›
        </button>
        <button onClick={() => setPrinting(true)} title="PDF로 저장 / 인쇄">
          PDF
        </button>
        <button onClick={onExit} title="처음으로 (Esc)">
          ✕
        </button>
      </div>
      <div className="show-stage">
        <Player
          key={i}
          ref={ref}
          component={SlideComp}
          inputProps={inputProps}
          durationInFrames={slides[i].frames}
          fps={FPS}
          compositionWidth={W}
          compositionHeight={H}
          autoPlay
          controls={false}
          clickToPlay={false}
          moveToBeginningWhenEnded={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
