import React from 'react';
import {interpolate} from 'remotion';
import {SNAPPY, SpringCfg, useT} from '../hooks';
import {C, F} from '../theme';
import {Icon} from './Icon';

// Springs content in at a (scene-relative) time: rises, un-blurs and fades in.
export const Pop: React.FC<{
  at: number;
  children: React.ReactNode;
  y?: number;
  x?: number;
  scale?: number;
  blur?: number;
  config?: SpringCfg;
  style?: React.CSSProperties;
}> = ({at, children, y = 40, x = 0, scale = 0.94, blur = 10, config = SNAPPY, style}) => {
  const {sp} = useT();
  const p = sp(at, config);
  const o = Math.min(1, p * 1.4);
  return (
    <div
      style={{
        opacity: o,
        transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px) scale(${scale + (1 - scale) * p})`,
        filter: blur && p < 0.99 ? `blur(${(1 - Math.min(1, p)) * blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Glass: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  glow?: string;
  active?: number;
}> = ({children, style, glow = C.coral, active = 0}) => (
  <div
    style={{
      position: 'relative',
      background: C.glass,
      border: `1px solid ${active > 0 ? mix(glow, active) : C.line}`,
      borderRadius: 22,
      boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)${
        active > 0 ? `, 0 0 ${60 * active}px ${hexA(glow, 0.35 * active)}` : ''
      }`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const mix = (hex: string, a: number) => hexA(hex, 0.15 + 0.7 * a);

export const Eyebrow: React.FC<{text: string; at: number}> = ({text, at}) => {
  const {lin} = useT();
  const p = lin(at, at + 0.6);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 22,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: C.coral,
        opacity: p,
      }}
    >
      <div style={{width: 48 * p, height: 2, background: C.coral, boxShadow: `0 0 12px ${C.coral}`}} />
      {text}
    </div>
  );
};

// Headline that reveals word by word. Wrap words in [brackets] to paint them coral.
export const Title: React.FC<{
  text: string;
  at: number;
  size?: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({text, at, size = 84, stagger = 0.08, style}) => {
  const {sp} = useT();
  const words = text.split(' ');
  return (
    <div
      style={{
        fontFamily: F.display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: -2,
        color: C.ink,
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const accent = w.startsWith('[');
        const clean = w.replace(/[[\]]/g, '');
        const p = sp(at + i * stagger, {damping: 16, stiffness: 140, mass: 0.8});
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`,
                opacity: Math.min(1, p * 2),
                ...(accent
                  ? {
                      color: C.coral,
                      textShadow: `0 0 28px ${hexA(C.coral, 0.45)}`,
                    }
                  : {}),
              }}
            >
              {clean}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: 'coral' | 'cyan' | 'green' | 'muted' | 'solid' | 'red';
  size?: number;
  style?: React.CSSProperties;
}> = ({children, tone = 'muted', size = 18, style}) => {
  const tones = {
    coral: {bg: hexA(C.coral, 0.16), fg: C.coralSoft, bd: hexA(C.coral, 0.5)},
    red: {bg: hexA(C.red, 0.14), fg: C.red, bd: hexA(C.red, 0.5)},
    cyan: {bg: hexA(C.cyan, 0.12), fg: C.cyan, bd: hexA(C.cyan, 0.4)},
    green: {bg: hexA(C.green, 0.12), fg: C.green, bd: hexA(C.green, 0.45)},
    muted: {bg: 'rgba(255,255,255,0.05)', fg: C.muted, bd: C.line},
    solid: {bg: C.coral, fg: '#fff', bd: C.coral},
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: `${size * 0.4}px ${size * 0.8}px`,
        borderRadius: 999,
        background: tones.bg,
        color: tones.fg,
        border: `1px solid ${tones.bd}`,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: size,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const IconBadge: React.FC<{name: string; color?: string; size?: number}> = ({
  name,
  color = C.coral,
  size = 56,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      display: 'grid',
      placeItems: 'center',
      background: hexA(color, 0.14),
      border: `1px solid ${hexA(color, 0.4)}`,
      color,
      boxShadow: `0 0 30px ${hexA(color, 0.25)}`,
    }}
  >
    <Icon name={name} size={size * 0.5} />
  </div>
);

// Small "stamp" animation for a badge landing on a card.
export const useStamp = (at: number) => {
  const {sp} = useT();
  const p = sp(at, {damping: 11, stiffness: 220, mass: 0.6});
  return {
    opacity: Math.min(1, p * 3),
    transform: `scale(${interpolate(p, [0, 1], [2.2, 1])}) rotate(${interpolate(p, [0, 1], [-14, -3])}deg)`,
  };
};
