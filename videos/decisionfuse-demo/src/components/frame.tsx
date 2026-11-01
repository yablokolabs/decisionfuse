import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {BRAND} from '../config';
import {SCENES} from '../storyboard';
import {OVERLAP, sec} from '../timing';
import {hexA} from './ui';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Zoom-through transition in and out of each scene, plus a slow camera push.
export const SceneFrame: React.FC<{children: React.ReactNode; push?: number; last?: boolean}> = ({
  children,
  push = 0.035,
  last,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const enter = interpolate(frame, [0, 20], [0, 1], clamp);
  const exitStart = durationInFrames - OVERLAP;
  const exit = last ? 0 : interpolate(frame, [exitStart, durationInFrames], [0, 1], clamp);
  const e = 1 - Math.pow(1 - enter, 3);
  const scale = (1.07 - 0.07 * e) * (1 - 0.06 * exit) * (1 + push * (frame / durationInFrames));
  const blur = (1 - e) * 14 + exit * 12;
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(e, 1 - exit),
        transform: `scale(${scale})`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const CHAPTERS = SCENES.filter((s) => s.chapter);

export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  if (CHAPTERS.length === 0) return null;
  const t = frame / 30;
  const first = CHAPTERS[0];
  const lastCh = CHAPTERS[CHAPTERS.length - 1];
  const vis =
    interpolate(frame, [sec(first.start) - 5, sec(first.start) + 15], [0, 1], clamp) *
    interpolate(frame, [sec(lastCh.end) - 10, sec(lastCh.end) + 5], [1, 0], clamp);
  if (vis <= 0) return null;
  const found = CHAPTERS.findIndex((c) => t >= c.start && t < c.end);
  const idx = found >= 0 ? found : t < first.start ? 0 : CHAPTERS.length - 1;
  const cur = CHAPTERS[idx];
  const sinceChange = frame - sec(cur.start);
  const labelIn = interpolate(sinceChange, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: vis, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: F.body,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 4,
          color: C.muted,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 9,
            background: C.coral,
            boxShadow: `0 0 ${10 + 8 * Math.sin(frame / 8)}px ${C.coral}`,
          }}
        />
        <span style={{color: C.ink}}>{BRAND.name.toUpperCase()}</span>
        <span style={{opacity: 0.4}}>/</span>
        <span
          style={{
            display: 'inline-block',
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * 14}px)`,
          }}
        >
          {cur.label.toUpperCase()}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 44,
          fontFamily: F.mono,
          fontSize: 20,
          color: C.muted,
        }}
      >
        <span style={{color: C.ink, fontWeight: 700}}>{String(idx + 1).padStart(2, '0')}</span>
        <span style={{opacity: 0.5}}> / {String(CHAPTERS.length).padStart(2, '0')}</span>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, bottom: 40, display: 'flex', gap: 10}}>
        {CHAPTERS.map((c, i) => {
          const p = interpolate(t, [c.start, c.end], [0, 1], clamp);
          const active = i === idx;
          return (
            <div key={c.id} style={{flex: c.end - c.start}}>
              <div style={{height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                <div
                  style={{
                    width: `${p * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${C.coral}, ${C.coralSoft})`,
                    boxShadow: active ? `0 0 12px ${hexA(C.coral, 0.8)}` : undefined,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: F.body,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: active ? C.ink : C.faint,
                }}
              >
                {c.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
