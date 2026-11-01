import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Icon} from '../components/Icon';
import {Chip, Eyebrow, Glass, hexA, Pop, Title} from '../components/ui';
import {useT} from '../hooks';
import {C, F} from '../theme';

// Every value below was recorded by the gated live-site suite on
// yablo.atlassian.net (evidence/2026-11-01-live-engine.md). Nothing is invented:
// the decision text, the finding, the quote, the proposal and the refusal all
// come from that run against Confluence page 426019 and Jira DFS-1.
const COPY = {
  eyebrow: 'Recorded run \u00b7 yablo.atlassian.net',
  title: 'The same loop, on [real] pages',
  page: 'Confluence 426019 \u00b7 checkout-guest \u00b7 v1 \u2192 v2',
  before: 'Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
  after: 'Guest checkout is no longer enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
  highlight: 'no longer',
  finding: {
    label: 'Finding \u00b7 DFS-1 / ac-1',
    tag: 'Obsolete scope',
    confidence: 'high confidence',
    quote: 'no longer',
  },
  proposal: {
    label: 'Proposal \u00b7 exact text, not a rewrite',
    text: 'Out of scope: Guest checkout is no longer enabled for first-time buyers.',
  },
  refusal: {
    label: 'Page edited again before approval',
    reason: 'stale-source',
    detail: 'writes: 0 \u00b7 audit row approval-rejected',
  },
  controls: ['DFS-2 unaffected', 'DFS-3 unlinked \u00b7 no finding'],
};

const Mono: React.FC<{children: React.ReactNode; tone?: 'dim' | 'hot'; style?: React.CSSProperties}> = ({
  children,
  tone = 'dim',
  style,
}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: 19,
      lineHeight: 1.5,
      color: tone === 'hot' ? C.ink : C.muted,
      background: tone === 'hot' ? 'rgba(232,151,31,0.10)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${tone === 'hot' ? hexA(C.coral, 0.5) : C.line}`,
      borderRadius: 12,
      padding: '16px 18px',
      ...style,
    }}
  >
    {children}
  </div>
);

const Panel: React.FC<{label: string; at: number; children: React.ReactNode; accent?: string}> = ({
  label,
  at,
  children,
  accent = C.cyan,
}) => (
  <Pop at={at} y={26}>
    <Glass style={{padding: '18px 22px', border: `1px solid ${hexA(accent, 0.35)}`}}>
      <div
        style={{
          fontFamily: F.body,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {children}
    </Glass>
  </Pop>
);

export const RealRun: React.FC = () => {
  const {sp} = useT();
  const stamp = sp(17.6, {damping: 11, stiffness: 220, mass: 0.6});
  return (
    <AbsoluteFill style={{padding: '130px 110px 110px', flexDirection: 'column', gap: 22}}>
      <Eyebrow text={COPY.eyebrow} at={0.2} />
      <Title text={COPY.title} at={0.3} size={78} />

      <div style={{display: 'flex', gap: 32, marginTop: 14, flex: 1}}>
        <div style={{flex: 1.05, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14}}>
          <Pop at={1.2} y={16}>
            <div style={{fontFamily: F.body, fontSize: 17, fontWeight: 600, letterSpacing: 1.6, color: C.faint}}>
              {COPY.page}
            </div>
          </Pop>
          <Pop at={1.8} y={18}>
            <Mono>{COPY.before}</Mono>
          </Pop>
          <Pop at={2.8} y={18}>
            <Mono tone="hot">
              {COPY.after.split(COPY.highlight).map((part, i, all) => (
                <React.Fragment key={i}>
                  {part}
                  {i < all.length - 1 && (
                    <span style={{color: C.coralSoft, fontWeight: 700, textDecoration: 'underline'}}>{COPY.highlight}</span>
                  )}
                </React.Fragment>
              ))}
            </Mono>
          </Pop>
          <Pop at={8.6} y={14} style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            {COPY.controls.map((text) => (
              <Chip key={text} tone="muted" size={16}>
                <Icon name="check" size={14} stroke={3} /> {text}
              </Chip>
            ))}
          </Pop>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
          <Panel label={COPY.finding.label} at={4.4} accent={C.coral}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
              <strong style={{fontFamily: F.display, fontSize: 30, color: C.ink}}>{COPY.finding.tag}</strong>
              <Chip tone="coral" size={15}>
                {COPY.finding.confidence}
              </Chip>
            </div>
            <div style={{fontFamily: F.body, fontSize: 17, color: C.muted, marginBottom: 10}}>
              Evidence span, resolves against page v2:
            </div>
            <Mono tone="hot" style={{fontSize: 17}}>
              &ldquo;{COPY.finding.quote}&rdquo;
            </Mono>
          </Panel>

          <Panel label={COPY.proposal.label} at={10.0} accent={C.cyan}>
            <div style={{fontFamily: F.mono, fontSize: 18, lineHeight: 1.5, color: C.ink}}>{COPY.proposal.text}</div>
          </Panel>

          <Panel label={COPY.refusal.label} at={15.0} accent={C.red}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${0.7 + 0.3 * stamp})`}}>
              <div style={{fontFamily: F.mono, fontSize: 26, fontWeight: 700, color: C.red}}>{COPY.refusal.reason}</div>
              <Chip tone="red" size={15}>
                nothing written
              </Chip>
            </div>
            <div style={{fontFamily: F.body, fontSize: 17, color: C.muted, marginTop: 10}}>{COPY.refusal.detail}</div>
          </Panel>
        </div>
      </div>
    </AbsoluteFill>
  );
};
