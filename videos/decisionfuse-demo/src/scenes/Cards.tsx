import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Shine} from '../components/fx';
import {Icon} from '../components/Icon';
import {Chip, Eyebrow, Glass, hexA, IconBadge, Title} from '../components/ui';
import {BOUNCY, useT} from '../hooks';
import {C, F} from '../theme';

// Three cards that flip up one at a time, then a call-to-action banner.
// Classic "problem" or "benefits" scene. Times are seconds into the scene.
const COPY = {
  eyebrow: 'The drift',
  title: 'Work built on an [old] decision',
  cards: [
    {at: 0.8, icon: 'question', title: 'Requirement flipped', body: 'An accepted criterion is reversed. The linked story still asks for the old behaviour.', chips: ['Wrong scope', 'Already built']},
    {at: 4.2, icon: 'clock', title: 'Scope dropped', body: 'A feature leaves the decision. The ticket keeps carrying it, sprint after sprint.', chips: ['Wasted effort', 'Silent']},
    {at: 7.6, icon: 'mail', title: 'Nobody told', body: 'The page changed on a Thursday. The board never heard about it.', chips: ['No link', 'No owner']},
  ],
  banner: {at: 11.0, text: 'Two lines of prose change. Weeks of work move.', accent: 'See the loop →'},
};

const Card: React.FC<{at: number; icon: string; title: string; body: string; chips: string[]}> = ({at, icon, title, body, chips}) => {
  const {sp, frame, at: atF} = useT();
  const p = sp(at, {damping: 15, stiffness: 120, mass: 0.9});
  const glow = interpolate(frame - atF(at), [0, 10, 50], [0, 1, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{flex: 1, perspective: 1200, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 160}px)`}}>
      <div style={{transform: `rotateX(${(1 - p) * 35}deg)`, transformOrigin: '50% 100%', height: '100%'}}>
        <Glass active={glow} style={{padding: 40, height: 440, display: 'flex', flexDirection: 'column', gap: 18}}>
          <IconBadge name={icon} size={64} />
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 40, color: C.ink, marginTop: 8}}>{title}</div>
          <div style={{fontFamily: F.body, fontSize: 24, lineHeight: 1.45, color: C.muted}}>{body}</div>
          <div style={{marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            {chips.map((c, i) => {
              const s = sp(at + 0.8 + i * 0.25, BOUNCY);
              return (
                <div key={c} style={{transform: `scale(${s})`}}>
                  <Chip tone="red" size={18}>
                    {c} <Icon name="x" size={14} stroke={3} />
                  </Chip>
                </div>
              );
            })}
          </div>
        </Glass>
      </div>
    </div>
  );
};

export const Cards: React.FC = () => {
  const {sp} = useT();
  const banner = sp(COPY.banner.at, {damping: 14, stiffness: 120});
  return (
    <AbsoluteFill style={{padding: '150px 120px 0', flexDirection: 'column', gap: 26}}>
      <Eyebrow text={COPY.eyebrow} at={0.3} />
      <Title text={COPY.title} at={0.4} size={92} />
      <div style={{display: 'flex', gap: 36, marginTop: 30}}>
        {COPY.cards.map((c) => (
          <Card key={c.title} {...c} />
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 24,
          opacity: Math.min(1, banner * 1.5),
          transform: `translateY(${(1 - banner) * 60}px) scale(${0.95 + 0.05 * banner})`,
          borderRadius: 20,
          padding: '26px 0',
          textAlign: 'center',
          background: `linear-gradient(90deg, ${hexA(C.coral, 0.15)}, ${hexA(C.coral, 0.32)}, ${hexA(C.coral, 0.15)})`,
          border: `1px solid ${hexA(C.coral, 0.6)}`,
          boxShadow: `0 0 60px ${hexA(C.coral, 0.35)}`,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 38,
          color: C.ink,
        }}
      >
        {COPY.banner.text} <span style={{color: C.coralSoft}}>{COPY.banner.accent}</span>
        <Shine at={COPY.banner.at + 0.5} duration={1.3} />
      </div>
    </AbsoluteFill>
  );
};
