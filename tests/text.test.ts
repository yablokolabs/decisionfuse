import { describe, expect, it } from 'vitest';
import { diffText, extractDecisionBlocks, hashText, normalizeText } from '../src/domain/text';

const page = `Intro paragraph.

BEGIN DECISION checkout-guest status=accepted
Guest checkout is accepted.
Payment must not require an account.
END DECISION

Some trailing notes.`;

describe('decision block extraction', () => {
  it('extracts a registered block with its status and body', () => {
    const blocks = extractDecisionBlocks(page);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe('checkout-guest');
    expect(blocks[0].status).toBe('accepted');
    expect(blocks[0].body).toContain('Guest checkout is accepted.');
  });

  it('extracts nothing from a page with no registered block', () => {
    expect(extractDecisionBlocks('Just prose, no markers here.')).toEqual([]);
  });

  it('keeps draft status distinct from accepted', () => {
    const blocks = extractDecisionBlocks('BEGIN DECISION pricing status=draft\nPrice stays.\nEND DECISION');
    expect(blocks[0].status).toBe('draft');
  });
});

describe('normalization and hashing', () => {
  it('ignores formatting-only edits', () => {
    const a = normalizeText('Payment must not\nrequire an account.');
    const b = normalizeText('Payment   must not require an account.');
    expect(a).toBe(b);
    expect(hashText(a)).toBe(hashText(b));
  });

  it('produces a stable 16 character hash', () => {
    expect(hashText('Guest checkout is accepted.')).toMatch(/^[0-9a-f]{16}$/);
    expect(hashText('Guest checkout is accepted.')).toBe(hashText('Guest checkout is accepted.'));
    expect(hashText('a')).not.toBe(hashText('b'));
  });
});

describe('diff spans', () => {
  it('reports the changed region and both sides', () => {
    const oldText = 'Guest checkout is accepted for all plans.';
    const newText = 'Guest checkout is no longer accepted.';
    const diff = diffText(oldText, newText);
    expect(diff.changed).toBe(true);
    expect(diff.removed).toContain('accepted');
    expect(diff.added).toContain('no longer');
    expect(newText.slice(diff.newSpan.start, diff.newSpan.end)).toBe(diff.added);
    expect(oldText.slice(diff.oldSpan.start, diff.oldSpan.end)).toBe(diff.removed);
  });

  it('reports no change for identical text', () => {
    expect(diffText('same text', 'same text').changed).toBe(false);
  });
});
