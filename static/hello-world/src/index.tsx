import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@forge/bridge';

interface Finding {
  id: string;
  blockId: string;
  issueKey: string;
  criterionId: string;
  classification: string;
  confidence: string;
  rationale: string;
  sourceVersion: number;
  sourceSpan: { quote: string };
  criterionSpan: { quote: string } | null;
  dedupeKey: string;
  lifecycle: string;
}

interface Proposal {
  id: string;
  operation: string;
  criterionId: string;
  exactText: string;
  expiresAt: string;
  issueKey: string;
}

interface Block {
  id: string;
  status: string;
  registered: boolean;
  baselineVersion: number | null;
  preview: string;
}

const navy = '#0e2440';
const amber = '#a35a00';
const amberSoft = '#f2e3cc';
const faint = '#5b6b7c';

const label: Record<string, string> = {
  'requirement-conflict': 'Requirement conflict',
  'obsolete-scope': 'Obsolete scope',
  'implementation-review': 'Implementation review',
  'insufficient-evidence': 'Uncertain — needs a human',
  unaffected: 'Unaffected control',
};

const button = (primary: boolean): React.CSSProperties => ({
  border: `1px solid ${primary ? navy : '#c9d1d9'}`,
  background: primary ? navy : 'transparent',
  color: primary ? '#fff' : navy,
  borderRadius: 4,
  padding: '5px 10px',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const chip = (text: string, tone: 'ok' | 'warn' | 'muted'): React.CSSProperties => ({
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  padding: '2px 7px',
  borderRadius: 10,
  border: `1px solid ${tone === 'ok' ? '#b7d7c2' : tone === 'warn' ? amberSoft : '#dde3e9'}`,
  color: tone === 'ok' ? '#1f6b3a' : tone === 'warn' ? amber : faint,
  background: tone === 'ok' ? '#f1f8f3' : tone === 'warn' ? '#fffdf8' : '#fafbfc',
});

const message = (text: string, kind: 'note' | 'error'): React.ReactElement => (
  <p
    role={kind === 'error' ? 'alert' : undefined}
    style={{ fontSize: 12, color: kind === 'error' ? '#8a1c1c' : faint, margin: '6px 0' }}
  >
    {text}
  </p>
);

function FindingCard({
  finding,
  onDismiss,
  onChanged,
}: {
  finding: Finding;
  onDismiss: (f: Finding) => void;
  onChanged: () => Promise<void> | void;
}) {
  const uncertain = finding.classification === 'insufficient-evidence';
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [outcome, setOutcome] = useState<{ text: string; kind: 'note' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const propose = async () => {
    setBusy(true);
    setOutcome(null);
    try {
      const result = (await invoke('proposeForFinding', {
        blockId: finding.blockId,
        findingId: finding.id,
      })) as { ok: boolean; reason?: string; proposal?: Proposal };
      if (!result.ok || !result.proposal) {
        setOutcome({ text: `No exact change to propose: ${result.reason ?? 'unknown reason'}.`, kind: 'error' });
        return;
      }
      setProposal(result.proposal);
    } catch (err) {
      setOutcome({ text: err instanceof Error ? err.message : 'Proposal failed', kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!proposal) return;
    setBusy(true);
    try {
      const result = (await invoke('approveAndApply', { proposalId: proposal.id })) as {
        status: string;
        reason?: string;
      };
      setOutcome(
        result.status === 'applied' || result.status === 'suggested'
          ? {
              text:
                result.status === 'suggested'
                  ? 'Recorded as a recommendation. No status transition was performed.'
                  : 'Applied to the issue and recorded in the audit trail.',
              kind: 'note',
            }
          : { text: `Approval rejected: ${result.reason ?? 'unknown reason'}. Nothing was written.`, kind: 'error' },
      );
      setProposal(null);
      await onChanged();
    } catch (err) {
      setOutcome({ text: err instanceof Error ? err.message : 'Approval failed', kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <li
      style={{
        listStyle: 'none',
        border: `1px solid ${amberSoft}`,
        borderLeft: `4px solid ${uncertain ? navy : amber}`,
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        background: '#fffdf8',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 13, color: navy }}>{label[finding.classification] ?? finding.classification}</strong>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: faint }}>
          {finding.confidence} confidence
        </span>
      </div>
      <p style={{ margin: '8px 0', fontSize: 13, color: '#2a3a4a', lineHeight: 1.5 }}>{finding.rationale}</p>
      <blockquote
        style={{
          margin: '8px 0',
          padding: '8px 12px',
          background: '#f7f5f0',
          borderLeft: `2px solid ${navy}`,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          color: '#2a3a4a',
        }}
      >
        {finding.sourceSpan.quote || 'source span unavailable'}
      </blockquote>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: faint, alignItems: 'center' }}>
        <span>
          {finding.issueKey} · {finding.criterionId} · source v{finding.sourceVersion}
        </span>
        <button onClick={propose} disabled={busy} style={{ ...button(true), marginLeft: 'auto' }}>
          Propose correction
        </button>
        <button onClick={() => onDismiss(finding)} disabled={busy} style={button(false)}>
          Dismiss with reason
        </button>
      </div>

      {outcome && message(outcome.text, outcome.kind)}

      {proposal && (
        <div style={{ marginTop: 10, border: `1px solid ${navy}`, borderRadius: 6, padding: 12, background: '#fff' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: faint, margin: 0 }}>
            Proposed {proposal.operation} · {proposal.criterionId} · expires {proposal.expiresAt.slice(0, 16).replace('T', ' ')} UTC
          </p>
          <p
            style={{
              margin: '8px 0',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              color: '#1d2f42',
              background: '#f7f5f0',
              padding: '8px 10px',
              borderRadius: 4,
            }}
          >
            {proposal.exactText}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={approve} disabled={busy} style={button(true)}>
              Approve and apply
            </button>
            <span style={{ fontSize: 11, color: faint }}>
              Single use. Rechecks your write permission, the source hash and the issue fingerprint first.
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

function FindingsList({
  findings,
  onDismiss,
  onChanged,
}: {
  findings: Finding[] | null;
  onDismiss: (f: Finding) => void;
  onChanged: () => Promise<void> | void;
}) {
  if (findings === null) return <p style={{ fontSize: 13, color: faint }}>Checking linked decisions…</p>;
  if (findings.length === 0) {
    return <p style={{ fontSize: 13, color: faint }}>No drift found for the linked decisions at their current versions.</p>;
  }
  return (
    <>
      <p style={{ fontSize: 12, color: faint, marginTop: 0 }}>
        {findings.length} finding{findings.length === 1 ? '' : 's'} need review. A model may propose; only an owner approves a
        write.
      </p>
      <ul style={{ padding: 0, margin: 0 }}>
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} onDismiss={onDismiss} onChanged={onChanged} />
        ))}
      </ul>
    </>
  );
}

function PageView({ pageId }: { pageId: string }) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [selected, setSelected] = useState('');
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [issueKey, setIssueKey] = useState('DFS-1');
  const [criterionId, setCriterionId] = useState('ac-1');
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = (await invoke('pageBlocks', { pageId })) as { version: number; blocks: Block[] };
      setBlocks(result.blocks);
      setVersion(result.version);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read this page');
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadFindings = useCallback(async (blockId: string) => {
    if (!blockId) {
      setFindings(null);
      return;
    }
    try {
      setFindings((await invoke('listFindings', { blockId })) as Finding[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read findings');
    }
  }, []);

  useEffect(() => {
    void loadFindings(selected);
  }, [selected, loadFindings]);

  const act = async (run: () => Promise<unknown>, said: string) => {
    setError(null);
    setNote(null);
    try {
      await run();
      setNote(said);
      await load();
      await loadFindings(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action failed');
    }
  };

  const dismiss = async (finding: Finding) => {
    const reason = window.prompt('Why is this finding not actionable?');
    if (!reason) return;
    await act(
      () =>
        invoke('dismissFinding', {
          blockId: finding.blockId,
          dedupe: finding.dedupeKey,
          reason,
        }),
      'Finding dismissed with a reason recorded.',
    );
  };

  const canLink = /^[A-Z][A-Z0-9_]{0,15}-\d{1,9}$/.test(issueKey) && /^ac-\d{1,4}$/.test(criterionId) && selected !== '';

  return (
    <section>
      <p style={{ fontSize: 12, color: faint, margin: '0 0 10px' }}>
        Page {pageId} · version {version ?? '…'}. Decisions are fenced blocks; only accepted blocks are actionable.
      </p>

      {note && message(note, 'note')}
      {error && message(error, 'error')}
      {blocks === null && !error && message('Reading decision blocks…', 'note')}
      {blocks !== null && blocks.length === 0 && message('No fenced decision block on this page.', 'note')}

      {blocks !== null && blocks.length > 0 && (
        <ul style={{ padding: 0, margin: '0 0 12px' }}>
          {blocks.map((block) => (
            <li
              key={block.id}
              style={{
                listStyle: 'none',
                border: `1px solid ${block.registered ? '#b7d7c2' : '#dde3e9'}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <code style={{ fontSize: 12, color: navy }}>{block.id}</code>
                <span style={chip(block.status, block.status === 'accepted' ? 'ok' : 'muted')}>{block.status}</span>
                <span style={chip(block.registered ? 'registered' : 'not registered', block.registered ? 'ok' : 'warn')}>
                  {block.registered ? `baseline v${block.baselineVersion}` : 'not registered'}
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button
                    style={button(!block.registered)}
                    onClick={() =>
                      act(
                        () => invoke('registerDecision', { pageId, blockId: block.id, status: block.status }),
                        `Registered ${block.id}.`,
                      )
                    }
                  >
                    {block.registered ? 'Re-baseline' : 'Register'}
                  </button>
                  <button
                    style={button(false)}
                    onClick={() => {
                      setSelected(block.id);
                      void act(
                        () => invoke('rescan', { pageId, blockId: block.id }),
                        `Rescanned ${block.id}.`,
                      );
                    }}
                  >
                    Rescan
                  </button>
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#2a3a4a', margin: '8px 0 0', lineHeight: 1.5 }}>{block.preview}</p>
            </li>
          ))}
        </ul>
      )}

      <div style={{ border: '1px solid #dde3e9', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: navy, margin: '0 0 8px', fontWeight: 600 }}>Link one issue criterion</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            style={{ fontSize: 12, padding: 5, border: '1px solid #dde3e9', borderRadius: 4, fontFamily: 'inherit' }}
          >
            <option value="">Select block</option>
            {(blocks ?? []).map((block) => (
              <option key={block.id} value={block.id}>
                {block.id}
              </option>
            ))}
          </select>
          <input
            value={issueKey}
            onChange={(event) => setIssueKey(event.target.value.toUpperCase())}
            placeholder="DFS-1"
            style={{ fontSize: 12, padding: 5, border: '1px solid #dde3e9', borderRadius: 4, width: 90, fontFamily: 'inherit' }}
          />
          <input
            value={criterionId}
            onChange={(event) => setCriterionId(event.target.value.toLowerCase())}
            placeholder="ac-1"
            style={{ fontSize: 12, padding: 5, border: '1px solid #dde3e9', borderRadius: 4, width: 70, fontFamily: 'inherit' }}
          />
          <button
            style={{ ...button(true), opacity: canLink ? 1 : 0.5 }}
            disabled={!canLink}
            onClick={() =>
              act(
                () => invoke('linkIssue', { blockId: selected, issueKey, criterionId }),
                `Linked ${issueKey} ${criterionId} to ${selected}.`,
              )
            }
          >
            Link
          </button>
        </div>
        <p style={{ fontSize: 11, color: faint, margin: '8px 0 0' }}>
          Links are explicit. Nothing is inferred from issue text.
        </p>
      </div>

      <FindingsList findings={findings} onDismiss={dismiss} onChanged={() => loadFindings(selected)} />
    </section>
  );
}

function IssueView() {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { issueKey } = (await invoke('context')) as { issueKey: string };
      setFindings((await invoke('issueFindings', { issueKey })) as Finding[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load findings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = async (finding: Finding) => {
    const reason = window.prompt('Why is this finding not actionable?');
    if (!reason) return;
    await invoke('dismissFinding', {
      blockId: finding.blockId,
      dedupe: finding.dedupeKey,
      reason,
    });
    await load();
  };

  return (
    <section>
      {error && message(error, 'error')}
      <FindingsList findings={findings} onDismiss={dismiss} onChanged={load} />
    </section>
  );
}

function App() {
  const [pageId, setPageId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      try {
        const { pageId: id } = (await invoke('context')) as { pageId: string };
        setPageId(id ?? '');
      } catch {
        setPageId('');
      }
    })();
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', padding: 16, color: navy, background: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 10, background: amber, display: 'inline-block' }} />
        <h1 style={{ fontSize: 15, margin: 0, letterSpacing: 0.2 }}>DecisionFuse</h1>
      </header>
      {pageId === undefined && message('Loading…', 'note')}
      {pageId === '' && <IssueView />}
      {pageId !== undefined && pageId !== '' && <PageView pageId={pageId} />}
    </main>
  );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
