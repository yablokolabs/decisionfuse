import {createContext, useContext} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {sec} from './timing';

// Scenes are mounted inside <Sequence>, so the current frame is relative to the
// scene. Every time passed to these helpers (and to Pop, Title, Shine, Cursor…)
// is in SECONDS FROM THE START OF THE SCENE, so a scene can be moved or
// re-timed in storyboard.tsx without touching its internals. SceneStart is kept
// for the few things that need the absolute position (e.g. audio waveforms).
export const SceneStart = createContext(0);

export type SpringCfg = {damping?: number; stiffness?: number; mass?: number};

export const SNAPPY: SpringCfg = {damping: 14, stiffness: 160, mass: 0.7};
export const SOFT: SpringCfg = {damping: 20, stiffness: 90, mass: 1};
export const BOUNCY: SpringCfg = {damping: 9, stiffness: 170, mass: 0.6};

export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = useContext(SceneStart);
  const at = (t: number) => sec(t);
  const sp = (t: number, config: SpringCfg = SNAPPY) =>
    spring({frame: frame - at(t), fps, config});
  // Linear 0..1 progress between two scene-relative times.
  const lin = (from: number, to: number, ease = Easing.inOut(Easing.cubic)) =>
    interpolate(frame, [at(from), at(to)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    });
  const after = (t: number) => frame >= at(t);
  return {frame, fps, at, sp, lin, after, start};
};

export const typed = (text: string, p: number) =>
  text.slice(0, Math.round(text.length * Math.max(0, Math.min(1, p))));
