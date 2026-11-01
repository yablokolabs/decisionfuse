import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './components/fx';
import {Hud, SceneFrame} from './components/frame';
import {AUDIO} from './config';
import {SceneStart} from './hooks';
import {SCENES, TOTAL_SECONDS} from './storyboard';
import {FONT_FACES} from './theme';
import {OVERLAP, sec} from './timing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Hold the first frame until the bundled fonts are ready, so no frame renders
// with a fallback font.
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

export const Main: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / 30;
  const i = Math.max(0, SCENES.findIndex((s) => t >= s.start && t < s.end));
  const s = SCENES[i];
  const next = SCENES[Math.min(i + 1, SCENES.length - 1)];
  const blend = interpolate(t, [s.end - 1, s.end], [0, 1], clamp);
  const hue = (s.hue ?? 0.5) * (1 - blend) + (next.hue ?? 0.5) * blend;
  const fadeOut = interpolate(t, [TOTAL_SECONDS - 0.7, TOTAL_SECONDS], [1, 0], clamp);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <Background hue={hue} />
        {SCENES.map((sc, idx) => {
          const Comp = sc.component;
          const last = idx === SCENES.length - 1;
          return (
            <Sequence
              key={sc.id}
              from={sec(sc.start)}
              durationInFrames={sec(sc.end) - sec(sc.start) + (last ? 0 : OVERLAP)}
              name={sc.id}
            >
              <SceneStart.Provider value={sc.start}>
                <SceneFrame last={last} push={sc.push ?? 0.035}>
                  <Comp />
                </SceneFrame>
              </SceneStart.Provider>
            </Sequence>
          );
        })}
        <Hud />
      </AbsoluteFill>
      {AUDIO.voiceover && <Audio src={staticFile(AUDIO.voiceover)} />}
    </AbsoluteFill>
  );
};
