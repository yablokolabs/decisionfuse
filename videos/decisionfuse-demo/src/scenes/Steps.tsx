import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Confetti, Shine} from '../components/fx';
import {Icon} from '../components/Icon';
import {Chip, Eyebrow, Glass, hexA, IconBadge, Pop, Title} from '../components/ui';
import {useT} from '../hooks';
import {C, F} from '../theme';

// "How it works": a stepper on the left fills in while a panel on the right
// swaps to each step, then everything gives way to one closing statement.
// For richer per-step panels (typing chat, ledger rows, token + cursor click,
// confetti), see examples/serviceloop/src/scenes/Workflow.tsx.
const COPY = {
  eyebrow: 'The review loop',
  title: 'From a changed page to an [approved] fix',
  steps: [
    {name: 'Register', sub: 'One decision block, owned, with a status and a version', icon: 'chat', at: 2.0, chips: ['blockId', 'accepted only']},
    {name: 'Link', sub: 'Explicit links to issues and their acceptance criteria', icon: 'sparkle', at: 14.0, chips: ['no guessing']},
    {name: 'Compare', sub: 'Baseline version against the current one, per criterion', icon: 'shield', at: 26.0, chips: ['evidence spans']},
    {name: 'Propose', sub: 'An exact amendment or a scope cut, then a human decides', icon: 'check', at: 38.0, chips: ['stale-safe', 'audited']},
  ],
  final: {
    at: 50.0,
    kicker: 'THE RULE',
    line1: 'A model can propose an interpretation.',
    line2: 'Only a permitted person approves a write.',
  },
};
const STEPS = COPY.steps;
const DONE_AT = COPY.final.at;

const Stepper: React.FC = () => {
  const {frame, at, sp, lin} = useT();
  const reached = (n: number) => frame >= at(n);
  const pts = STEPS.map((s) => at(s.at)).concat(at(DONE_AT));
  // The rail runs from the first circle to the last; fill reaches step k's circle as it starts.
  const fill = interpolate(frame, pts, pts.map((_, i) => Math.min(100, (i / (STEPS.length - 1)) * 100)), {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'relative', width: 470, display: 'flex', flexDirection: 'column', gap: 22, alignSelf: 'flex-start'}}>
      <div style={{position: 'absolute', left: 31, top: 40, bottom: 40, width: 2, background: C.line}} />
      <div
        style={{
          position: 'absolute',
          left: 31,
          top: 40,
          width: 2,
          height: `${fill}%`,
          background: `linear-gradient(${C.cyan}, ${C.coral})`,
          boxShadow: `0 0 10px ${C.cyan}`,
        }}
      />
      {STEPS.map((s, i) => {
        const next = STEPS[i + 1]?.at ?? DONE_AT;
        const active = reached(s.at) && !reached(next);
        const done = reached(next);
        const enter = sp(0.4 + i * 0.12);
        const a = lin(s.at, s.at + 0.3) * (1 - lin(next, next + 0.3));
        return (
          <div
            key={s.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '14px 18px 14px 6px',
              borderRadius: 18,
              background: a > 0 ? hexA(C.coral, 0.12 * a) : 'transparent',
              border: `1px solid ${a > 0 ? hexA(C.coral, 0.6 * a) : 'transparent'}`,
              boxShadow: a > 0 ? `0 0 40px ${hexA(C.coral, 0.25 * a)}` : undefined,
              opacity: enter * (active || done ? 1 : 0.45),
              transform: `translateX(${(1 - enter) * -40}px) scale(${1 + 0.03 * a})`,
              transformOrigin: 'left center',
            }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: 52,
                height: 52,
                borderRadius: 99,
                display: 'grid',
                placeItems: 'center',
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 20,
                background: done ? C.cyan : active ? C.coral : C.bg2,
                color: done ? '#04121c' : '#fff',
                border: `1px solid ${done || active ? 'transparent' : C.line}`,
                boxShadow: active ? `0 0 24px ${C.coral}` : done ? `0 0 16px ${hexA(C.cyan, 0.6)}` : undefined,
              }}
            >
              {done ? <Icon name="check" size={24} stroke={3} /> : i + 1}
            </div>
            <div>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.ink}}>{s.name}</div>
              <div style={{fontFamily: F.body, fontSize: 19, color: C.muted, marginTop: 2}}>{s.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Panel: React.FC<{from: number; to: number; i: number}> = ({from, to, i}) => {
  const {frame, at, lin} = useT();
  if (frame < at(from) - 1 || frame > at(to) + 12) return null;
  const s = STEPS[i];
  const pin = lin(from, from + 0.5);
  const pout = lin(to, to + 0.4);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: pin * (1 - pout),
        transform: `translateX(${(1 - pin) * 120 - pout * 120}px) scale(${0.96 + 0.04 * pin})`,
        filter: pin < 1 || pout > 0 ? `blur(${(1 - pin) * 10 + pout * 10}px)` : undefined,
      }}
    >
      <Glass style={{height: '100%', padding: 48, display: 'flex', flexDirection: 'column', gap: 26}}>
        <div style={{fontFamily: F.mono, fontSize: 20, letterSpacing: 3, color: C.coral, fontWeight: 700}}>
          STEP {i + 1} · {s.name.toUpperCase()}
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, paddingBottom: 40}}>
          <Pop at={from + 0.3}>
            <IconBadge name={s.icon} size={96} />
          </Pop>
          <Pop at={from + 0.5}>
            <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 56, color: C.ink}}>{s.name}</div>
          </Pop>
          <Pop at={from + 0.7}>
            <div style={{fontFamily: F.body, fontSize: 28, color: C.muted}}>{s.sub}</div>
          </Pop>
          <div style={{display: 'flex', gap: 14}}>
            {s.chips.map((c, k) => (
              <Pop key={c} at={from + 1.0 + k * 0.2} y={14}>
                <Chip tone={k === 0 ? 'cyan' : 'green'} size={20}>
                  {c}
                </Chip>
              </Pop>
            ))}
          </div>
        </div>
      </Glass>
      {i === STEPS.length - 1 && <Confetti at={from + 0.6} x={120} y={760} />}
    </div>
  );
};

const Final: React.FC = () => {
  const {sp} = useT();
  const p = sp(DONE_AT, {damping: 16, stiffness: 110});
  return (
    <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: Math.min(1, p * 1.4), transform: `scale(${0.9 + 0.1 * p})`}}>
      <div
        style={{
          position: 'relative',
          padding: '60px 64px',
          borderRadius: 28,
          background: `linear-gradient(135deg, ${hexA(C.cyan, 0.1)}, ${hexA(C.coral, 0.18)})`,
          border: `1px solid ${hexA(C.coral, 0.5)}`,
          boxShadow: `0 0 90px ${hexA(C.coral, 0.25)}`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22}}>
          <Icon name="shield" size={44} color={C.cyan} />
          <div style={{fontFamily: F.mono, fontSize: 20, letterSpacing: 3, color: C.cyan, fontWeight: 700}}>{COPY.final.kicker}</div>
        </div>
        <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 54, lineHeight: 1.15, color: C.ink}}>{COPY.final.line1}</div>
        <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 54, lineHeight: 1.15, color: C.coralSoft, marginTop: 8}}>
          {COPY.final.line2}
        </div>
        <Shine at={DONE_AT + 0.6} duration={1.4} />
      </div>
    </div>
  );
};

export const Steps: React.FC = () => {
  const {lin} = useT();
  const panelsOut = lin(DONE_AT - 0.2, DONE_AT + 0.3);
  return (
    <AbsoluteFill style={{padding: '140px 120px 120px', flexDirection: 'column', gap: 22}}>
      <Eyebrow text={COPY.eyebrow} at={0.2} />
      <Title text={COPY.title} at={0.3} size={84} />
      <div style={{display: 'flex', gap: 60, flex: 1, marginTop: 20}}>
        <Stepper />
        <div style={{position: 'relative', flex: 1}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - panelsOut}}>
            {STEPS.map((s, i) => (
              <Panel key={s.name} i={i} from={s.at} to={STEPS[i + 1]?.at ?? DONE_AT + 1} />
            ))}
          </div>
          <Final />
        </div>
      </div>
    </AbsoluteFill>
  );
};
