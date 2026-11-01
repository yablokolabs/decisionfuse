import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Shine, Waveform} from '../components/fx';
import {Chip, hexA, Pop, Title} from '../components/ui';
import {BRAND} from '../config';
import {SOFT, useT} from '../hooks';
import {C, F} from '../theme';

// Closing card: brand mark with a pulsing ring on the left, headline + CTA on
// the right. Times are seconds into the scene.
const COPY = {
  line1: 'Decisions change.',
  line2: '[Work] [should] [catch up.]',
  sub: 'Evidence first. Then an owner-approved correction. Never an automatic close.',
  cta: 'github.com/yablokolabs/decisionfuse',
  footnote: 'Development install · synthetic data · no automatic closure',
};

export const Outro: React.FC = () => {
  const {sp, frame} = useT();
  const logo = sp(0.2, SOFT);
  const ring = (frame % 60) / 60;
  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '0 140px', gap: 120}}>
      <div style={{flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44}}>
        <div style={{position: 'relative'}}>
          <div style={{position: 'absolute', inset: -40 - ring * 60, borderRadius: 60, border: `2px solid ${hexA(C.coral, 0.5 * (1 - ring))}`}} />
          <div
            style={{
              position: 'relative',
              background: BRAND.logo ? '#fafaf7' : `linear-gradient(135deg, ${C.coral}, ${C.coralSoft})`,
              borderRadius: 32,
              padding: '28px 36px',
              transform: `scale(${0.5 + 0.5 * logo}) rotate(${(1 - logo) * -8}deg)`,
              opacity: Math.min(1, logo * 1.5),
              boxShadow: `0 30px 90px rgba(0,0,0,0.5), 0 0 120px ${hexA(C.coral, 0.45)}`,
            }}
          >
            {BRAND.logo ? (
              <Img src={staticFile(BRAND.logo)} style={{width: 520, display: 'block'}} />
            ) : (
              <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 64, color: '#fff', padding: '10px 20px'}}>{BRAND.name}</div>
            )}
            <Shine at={1.0} duration={1.3} />
          </div>
        </div>
        <Waveform width={420} height={90} bars={26} />
        <Pop at={1.2} y={14}>
          <div style={{fontFamily: F.body, fontSize: 26, color: C.muted, letterSpacing: 1}}>{COPY.footnote}</div>
        </Pop>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 36}}>
        <div>
          <Title text={COPY.line1} at={0.4} size={124} />
          <Title text={COPY.line2} at={0.7} size={124} />
        </div>
        <Pop at={1.4} y={20}>
          <div style={{fontFamily: F.body, fontSize: 36, color: C.ink}}>{COPY.sub}</div>
        </Pop>
        <Pop at={1.8} y={20}>
          <Chip tone="coral" size={26}>
            {COPY.cta}
          </Chip>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
