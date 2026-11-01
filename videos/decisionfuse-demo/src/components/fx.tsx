import {noise2D} from '@remotion/noise';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useT} from '../hooks';
import {AUDIO} from '../config';
import {C} from '../theme';
import {hexA} from './ui';

// Slow drifting colour fields + perspective grid + dust. Rendered once for the
// whole video so scene changes feel like one continuous space.
export const Background: React.FC<{hue: number}> = ({hue}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const blob = (seed: string, cx: number, cy: number, r: number, color: string, a: number) => {
    const x = cx + noise2D(seed + 'x', t * 0.05, 0) * 260;
    const y = cy + noise2D(seed + 'y', 0, t * 0.05) * 180;
    return `radial-gradient(${r}px ${r * 0.8}px at ${x}px ${y}px, ${hexA(color, a)}, transparent 70%)`;
  };
  // hue: 0 = coral-forward, 1 = cool/cyan-forward
  const coralA = 0.24 - hue * 0.1;
  const cyanA = 0.08 + hue * 0.1;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: [
            blob('a', 1500, 200, 900, C.coral, coralA),
            blob('b', 300, 900, 1000, '#1d5d8f', 0.35),
            blob('c', 1000, 600, 700, C.cyan, cyanA),
            `linear-gradient(160deg, ${C.bg2}, ${C.bg} 60%)`,
          ].join(','),
        }}
      />
      <AbsoluteFill
        style={{
          perspective: 900,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 55%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 55%, black 20%, transparent 75%)',
          opacity: 0.55,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -960,
            right: -960,
            top: 380,
            height: 1400,
            transform: 'rotateX(68deg)',
            transformOrigin: '50% 0%',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            backgroundPosition: `0px ${(frame * 0.6) % 80}px`,
          }}
        />
      </AbsoluteFill>
      {new Array(40).fill(0).map((_, i) => {
        const x = random('px' + i) * 1920;
        const speed = 0.15 + random('ps' + i) * 0.4;
        const y = (random('py' + i) * 1200 - frame * speed) % 1200;
        const yy = y < 0 ? y + 1200 : y;
        const s = 1 + random('pz' + i) * 2.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + noise2D('pn' + i, t * 0.1, 0) * 40,
              top: yy - 60,
              width: s,
              height: s,
              borderRadius: 9,
              background: i % 5 === 0 ? C.coralSoft : '#cfe6ff',
              opacity: 0.15 + random('po' + i) * 0.35,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))'}}
      />
    </AbsoluteFill>
  );
};

// Waveform bars. With a voiceover configured in storyboard.tsx (AUDIO.viz) the
// bars follow the real voice; otherwise they idle with a gentle wave.
type WaveProps = {bars?: number; height?: number; width?: number; color?: string};

const Bars: React.FC<WaveProps & {values: number[]}> = ({values, bars = 28, height = 90, width = 420, color = '#ffffff'}) => {
  const {frame} = useT();
  const gap = width / bars;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: gap * 0.45, height, width}}>
      {values.map((v, i) => {
        const idle = 0.12 + 0.06 * Math.sin(frame / 7 + i * 0.7);
        const h = Math.max(idle, v) * height;
        return (
          <div
            key={i}
            style={{
              width: gap * 0.55,
              height: h,
              borderRadius: 99,
              background: `linear-gradient(180deg, ${color}, ${hexA(C.coral, 0.9)})`,
              boxShadow: `0 0 14px ${hexA(C.coral, 0.4)}`,
            }}
          />
        );
      })}
    </div>
  );
};

const AudioWaveform: React.FC<WaveProps & {src: string}> = ({src, bars = 28, ...rest}) => {
  const {frame, start} = useT();
  const {fps} = useVideoConfig();
  const audio = useAudioData(staticFile(src));
  let values: number[] = new Array(bars).fill(0.05);
  if (audio) {
    const v = visualizeAudio({fps, frame: frame + Math.round(start * fps), audioData: audio, numberOfSamples: 64, smoothing: true});
    const half = Math.ceil(bars / 2);
    const side = new Array(half).fill(0).map((_, i) => Math.min(1, Math.sqrt(v[i + 1] ?? 0) * 2.2));
    values = [...side.slice().reverse(), ...side].slice(0, bars);
  }
  return <Bars values={values} bars={bars} {...rest} />;
};

const IdleWaveform: React.FC<WaveProps> = ({bars = 28, ...rest}) => {
  const {frame} = useT();
  const values = new Array(bars).fill(0).map((_, i) => {
    const center = 1 - Math.abs(i - bars / 2) / (bars / 2);
    return 0.15 + 0.7 * center * Math.abs(noise2D('w', i * 0.35, frame / 18));
  });
  return <Bars values={values} bars={bars} {...rest} />;
};

export const Waveform: React.FC<WaveProps> = (props) =>
  AUDIO.viz ? <AudioWaveform src={AUDIO.viz} {...props} /> : <IdleWaveform {...props} />;

export const Confetti: React.FC<{at: number; x: number; y: number; count?: number}> = ({
  at,
  x,
  y,
  count = 70,
}) => {
  const {frame, at: atF} = useT();
  const f = frame - atF(at);
  if (f < 0 || f > 75) return null;
  const colors = [C.coral, C.cyan, C.green, '#ffffff', C.coralSoft];
  return (
    <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const ang = random('ca' + i) * Math.PI * 2;
        const v = 9 + random('cv' + i) * 16;
        const px = Math.cos(ang) * v * f * 0.9;
        const py = Math.sin(ang) * v * f * 0.9 - 0 + 0.35 * f * f;
        const rot = f * (random('cr' + i) * 20 - 10);
        const o = interpolate(f, [0, 50, 75], [1, 1, 0]);
        const w = 6 + random('cw' + i) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: w,
              height: w * 0.45,
              background: colors[i % colors.length],
              transform: `rotate(${rot}deg)`,
              opacity: o,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
};

// Pointer that glides in to (0,0) of its container and clicks at `clickAt`.
export const Cursor: React.FC<{arriveAt: number; clickAt: number; from?: [number, number]; x?: number; y?: number}> = ({
  arriveAt,
  clickAt,
  from = [220, 160],
  x = 0,
  y = 0,
}) => {
  const {lin, frame, at} = useT();
  const p = lin(arriveAt, clickAt - 0.1);
  if (frame < at(arriveAt) - 2) return null;
  const cf = frame - at(clickAt);
  const press = cf >= 0 && cf < 6 ? 0.82 : 1;
  const ring = cf >= 0 && cf < 22 ? cf / 22 : -1;
  const fade = interpolate(frame, [at(clickAt) + 25, at(clickAt) + 40], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x + from[0] * (1 - p),
        top: y + from[1] * (1 - p),
        zIndex: 50,
        opacity: Math.min(p * 4, 1) * fade,
        pointerEvents: 'none',
      }}
    >
      {ring >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: -40 * (0.4 + ring),
            top: -40 * (0.4 + ring),
            width: 80 * (0.4 + ring),
            height: 80 * (0.4 + ring),
            borderRadius: 999,
            border: `3px solid ${C.coralSoft}`,
            opacity: 1 - ring,
          }}
        />
      )}
      <svg width="38" height="38" viewBox="0 0 24 24" style={{transform: `scale(${press})`, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'}}>
        <path d="M4 2.5 19.5 12l-7 1.6-3.4 6.9z" fill="#fff" stroke="#0b1b2b" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const TypingDots: React.FC<{color?: string}> = ({color = C.muted}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', gap: 7, padding: '6px 2px'}}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 9,
            background: color,
            opacity: 0.35 + 0.65 * Math.max(0, Math.sin(frame / 4 - i * 0.9)),
            transform: `translateY(${-4 * Math.max(0, Math.sin(frame / 4 - i * 0.9))}px)`,
          }}
        />
      ))}
    </div>
  );
};

// Sweeping light across an element (used on banners and CTAs).
export const Shine: React.FC<{at: number; duration?: number}> = ({at, duration = 1.1}) => {
  const {lin} = useT();
  const p = lin(at, at + duration);
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -50,
          bottom: -50,
          width: 220,
          left: `${-20 + p * 140}%`,
          transform: 'skewX(-20deg)',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
        }}
      />
    </div>
  );
};
