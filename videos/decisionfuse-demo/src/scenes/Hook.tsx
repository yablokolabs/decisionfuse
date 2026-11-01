import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Shine, Waveform} from '../components/fx';
import {Icon} from '../components/Icon';
import {Chip, Eyebrow, Glass, hexA, Pop, Title} from '../components/ui';
import {SOFT, useT} from '../hooks';
import {C, F} from '../theme';

// Opening hook: big two-line headline on the left, a tilted "product moment"
// panel on the right. All times are seconds from the start of this scene.
const COPY = {
  eyebrow: 'Confluence decision \u00b7 linked Jira work',
  line1: 'Decisions [change].',
  line2: '[Work] [should] [catch up.]',
  sub: 'Reviewed drift between an accepted decision and the tickets built on it.',
  chip: 'Concept walkthrough \u00b7 prototype',
  panelTitle: 'Decision block \u00b7 checkout',
  bubbles: [
    {side: 'in' as const, text: 'Guest checkout is accepted.', at: 1.0},
    {side: 'out' as const, text: 'Updated: sign-in required before payment.', at: 2.4},
  ],
  done: {label: '3 linked issues', at: 4.2},
  caption: 'Source version 7 \u2192 8',
};

const Bubble: React.FC<{at: number; side: 'in' | 'out'; children: React.ReactNode}> = ({at, side, children}) => (
  <Pop at={at} x={side === 'in' ? -30 : 30} y={20} style={{alignSelf: side === 'in' ? 'flex-start' : 'flex-end'}}>
    <div
      style={{
        maxWidth: 420,
        padding: '18px 22px',
        borderRadius: 20,
        borderBottomLeftRadius: side === 'in' ? 6 : 20,
        borderBottomRightRadius: side === 'out' ? 6 : 20,
        fontFamily: F.body,
        fontSize: 24,
        lineHeight: 1.35,
        color: side === 'out' ? '#fff' : C.ink,
        background: side === 'out' ? `linear-gradient(135deg, ${C.coral}, ${C.coralSoft})` : 'rgba(255,255,255,0.08)',
        border: side === 'out' ? 'none' : `1px solid ${C.line}`,
        boxShadow: side === 'out' ? `0 12px 40px ${hexA(C.coral, 0.45)}` : '0 12px 30px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </div>
  </Pop>
);

export const Hook: React.FC = () => {
  const {frame, sp, lin} = useT();
  const panel = sp(0.3, SOFT);
  const rotY = -18 + 10 * panel + Math.sin(frame / 50) * 1.5;
  const done = sp(COPY.done.at, {damping: 10, stiffness: 200, mass: 0.6});
  return (
    <AbsoluteFill style={{padding: '0 120px', flexDirection: 'row', alignItems: 'center', gap: 80}}>
      <div style={{flex: 1.1, display: 'flex', flexDirection: 'column', gap: 34}}>
        <Eyebrow text={COPY.eyebrow} at={0.2} />
        <div>
          <Title text={COPY.line1} at={0.4} size={112} />
          <Title text={COPY.line2} at={0.75} size={112} />
        </div>
        <Pop at={1.4} y={20}>
          <div style={{fontFamily: F.body, fontSize: 34, color: C.muted}}>{COPY.sub}</div>
        </Pop>
        <Pop at={1.8} y={16}>
          <div
            style={{
              display: 'inline-block',
              background: '#fbfaf6',
              borderRadius: 18,
              padding: '16px 22px',
              boxShadow: `0 24px 70px ${hexA(C.coral, 0.22)}`,
            }}
          >
            <Img src={staticFile('logo.png')} style={{width: 380, display: 'block'}} />
          </div>
        </Pop>
        <Pop at={2.2} y={14}>
          <Chip tone="coral" size={20}>
            <Icon name="clock" size={20} /> {COPY.chip}
          </Chip>
        </Pop>
      </div>
      <div style={{flex: 0.9, perspective: 1400}}>
        <div
          style={{
            transform: `rotateY(${rotY}deg) rotateX(${4 - 4 * panel}deg) translateY(${(1 - panel) * 120}px)`,
            opacity: Math.min(1, panel * 1.5),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -80,
              background: `radial-gradient(closest-side, ${hexA(C.coral, 0.35)}, transparent)`,
              opacity: 0.6 + 0.4 * lin(COPY.done.at - 0.2, COPY.done.at + 0.4),
            }}
          />
          <Glass style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 18, minHeight: 520}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6}}>
              <div style={{width: 12, height: 12, borderRadius: 9, background: C.green, boxShadow: `0 0 12px ${C.green}`}} />
              <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 20, color: C.ink}}>{COPY.panelTitle}</div>
              <div style={{fontFamily: F.body, fontSize: 18, color: C.muted}}>· online</div>
            </div>
            {COPY.bubbles.map((b, i) => (
              <Bubble key={i} at={b.at} side={b.side}>
                {b.text}
              </Bubble>
            ))}
            <div style={{alignSelf: 'flex-end', opacity: Math.min(1, done * 2), transform: `scale(${0.4 + 0.6 * done})`}}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  borderRadius: 14,
                  background: C.green,
                  color: '#04120b',
                  fontFamily: F.body,
                  fontWeight: 800,
                  fontSize: 22,
                  boxShadow: `0 0 40px ${hexA(C.green, 0.55)}`,
                }}
              >
                {COPY.done.label} <Icon name="check" size={22} stroke={3} />
                <Shine at={COPY.done.at + 0.3} />
              </div>
            </div>
          </Glass>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 34}}>
            <Waveform width={460} height={84} bars={30} />
            <div style={{fontFamily: F.body, fontSize: 20, color: C.muted, letterSpacing: 1}}>{COPY.caption}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
