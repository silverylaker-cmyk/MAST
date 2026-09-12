import { COLORS, CLASS_COLOR } from './theme';
import { useRise, useReveal, easeOut } from './anim';
import type { FamilyResult } from '../lib/types';

const base = import.meta.env.BASE_URL;

/** 사용자가 만든 그림. 파일이 없으면 자리만 비운다. */
type Fade = 'right' | 'left' | 'bottom' | 'top' | 'none';
const FADE: Record<Fade, string | undefined> = {
  none: undefined,
  right: 'linear-gradient(to right, #000 55%, transparent 100%)',
  left: 'linear-gradient(to left, #000 55%, transparent 100%)',
  bottom: 'linear-gradient(to bottom, #000 60%, transparent 100%)',
  top: 'linear-gradient(to top, #000 60%, transparent 100%)',
};

/** 사용자가 만든 그림. 파일이 없으면 자리만 비운다. fade: 글자와 겹치는 쪽을 투명하게 */
export function Illust({ src, style, fade = 'none' }: { src: string; style?: React.CSSProperties; fade?: Fade }) {
  const mask = FADE[fade];
  return (
    <img
      src={`${base}images/${src}`}
      alt=""
      style={{ objectFit: 'contain', WebkitMaskImage: mask, maskImage: mask, ...style }}
      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
    />
  );
}

export function Frame({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        color: COLORS.ink,
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        padding: '80px 110px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 18,
          height: '100%',
          background: `linear-gradient(${COLORS.mint}, ${COLORS.sky})`,
        }}
      />
      {children}
    </div>
  );
}

export function Title({ children, delay = 0, size = 64 }: { children: React.ReactNode; delay?: number; size?: number }) {
  const st = useRise(delay);
  return (
    <h1 style={{ fontSize: size, fontWeight: 900, margin: '0 0 24px', lineHeight: 1.25, ...st }}>{children}</h1>
  );
}

export function Sub({ children, delay = 8, size = 34 }: { children: React.ReactNode; delay?: number; size?: number }) {
  const st = useRise(delay);
  return <p style={{ fontSize: size, color: COLORS.sub, margin: '0 0 16px', lineHeight: 1.5, ...st }}>{children}</p>;
}

export function Em({ children, color = COLORS.mintDark }: { children: React.ReactNode; color?: string }) {
  return <span style={{ color, fontWeight: 900 }}>{children}</span>;
}

/** 항원 태그: Class에 따라 글자색 */
export function Tag({ r, delay = 0, size = 34 }: { r: FamilyResult; delay?: number; size?: number }) {
  const t = easeOut(useReveal()(delay, 14));
  const color = CLASS_COLOR[r.cls] ?? CLASS_COLOR[1];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        padding: `${size * 0.28}px ${size * 0.6}px`,
        borderRadius: 999,
        background: '#fff',
        border: `${Math.max(2, size / 12)}px solid ${color}`,
        color,
        fontSize: size,
        fontWeight: 900,
        opacity: t,
        transform: `scale(${0.85 + 0.15 * t})`,
        whiteSpace: 'nowrap',
      }}
    >
      {r.family}
      <span style={{ fontSize: size * 0.58, fontWeight: 700, opacity: 0.85 }}>Class {r.cls}</span>
    </span>
  );
}

export function ClassLegend({ delay = 0 }: { delay?: number }) {
  const st = useRise(delay);
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 22, color: COLORS.sub, ...st }}>
      <span>정도:</span>
      {[
        [1, 2],
        [3, 4],
        [5, 6],
      ].map(([a, b]) => (
        <span key={a} style={{ color: CLASS_COLOR[a], fontWeight: 900 }}>
          Class {a}·{b}
        </span>
      ))}
      <span style={{ marginLeft: 8 }}>→ 숫자가 클수록 반응이 강합니다</span>
    </div>
  );
}

export function Footer({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', right: 110, bottom: 40, fontSize: 22, color: COLORS.sub }}>{text}</div>
  );
}
