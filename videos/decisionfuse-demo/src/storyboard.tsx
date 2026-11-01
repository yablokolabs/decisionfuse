import React from 'react';
import {Cards} from './scenes/Cards';
import {Hook} from './scenes/Hook';
import {Outro} from './scenes/Outro';
import {Steps} from './scenes/Steps';

export type SceneDef = {
  id: string;
  // Absolute seconds on the final timeline. When remaking a narrated video,
  // copy these from the original's scene cuts so the voiceover stays in sync.
  start: number;
  end: number;
  // Label in the header and the chapter bar.
  label: string;
  component: React.FC;
  // Chapter scenes get the header + progress bar; hook/outro usually don't.
  chapter?: boolean;
  // Background mood: 0 = warm accent glow, 1 = cool cyan glow.
  hue?: number;
  // Slow camera push-in across the scene (0 disables it).
  push?: number;
};

export const SCENES: SceneDef[] = [
  {id: 'hook', start: 0, end: 9, label: 'Intro', component: Hook, hue: 0},
  {id: 'problem', start: 9, end: 61, label: 'The drift', component: Cards, chapter: true, hue: 0.2},
  {id: 'how', start: 61, end: 143, label: 'The review loop', component: Steps, chapter: true, hue: 0.7},
  {id: 'outro', start: 143, end: 155, label: 'Status', component: Outro, hue: 0},
];

export const TOTAL_SECONDS = SCENES[SCENES.length - 1].end;
