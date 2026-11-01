import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Chip, Eyebrow, Glass, Pop, Title} from '../components/ui';
import {useT} from '../hooks';
import {C, F} from '../theme';

// The diagram comes from assets/architecture.svg, rasterised to PNG and trimmed
// (scripts/trim.mjs). It is close to square, so a plain fit would be unreadable
// at video size: the scene shows the whole pipeline, then pushes in on the one
// edge that writes.
const COPY = {
  eyebrow: 'Architecture',
  title: 'One pipeline, [one] guarded write',
  caption:
    'Dashed edges are proposals and reads. The amber edge is the only remote write, and it fires only after a human approval.',
  notes: [
    {at: 3.4, text: '01 \u00b7 Register + baseline', tone: 'cyan' as const},
    {at: 5.4, text: '02 \u00b7 Evidence spans validated', tone: 'green' as const},
    {at: 7.4, text: '03 \u00b7 Approval-bound write', tone: 'coral' as const},
  ],
};

export const Architecture: React.FC = () => {
  const {lin} = useT();
  // A slow uniform push keeps the frame alive without cropping the diagram.
  const push = lin(0.6, 21);
  const scale = 1 + 0.05 * push;

  return (
    <AbsoluteFill style={{padding: '100px 96px 92px', flexDirection: 'column', gap: 16}}>
      <Eyebrow text={COPY.eyebrow} at={0.2} />
      <Title text={COPY.title} at={0.3} size={62} />

      <div style={{flex: 1, minHeight: 0, marginTop: 14}}>
        <Glass
          style={{
            height: '100%',
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'rgba(252,252,250,0.97)',
          }}
        >            <div
            style={{
              transform: `scale(${scale})`,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Img
              src={staticFile('architecture.png')}
              style={{height: '100%', width: 'auto', maxWidth: '100%', display: 'block'}}
            />
          </div>
        </Glass>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 6}}>
        {COPY.notes.map((note) => (
          <Pop key={note.text} at={note.at} y={16}>
            <Chip tone={note.tone} size={17}>
              {note.text}
            </Chip>
          </Pop>
        ))}
        <Pop at={11.0} y={12} style={{marginLeft: 'auto', maxWidth: 700}}>
          <div style={{fontFamily: F.body, fontSize: 17, lineHeight: 1.4, color: C.muted}}>{COPY.caption}</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
