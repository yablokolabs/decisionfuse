import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@forge/bridge';

interface Finding {
  id: string;
  issueKey: string;
  criterionId: string;
  classification: string;
  confidence: string;
  rationale: string;
  sourceVersion: number;
  sourceSpan: { quote: string };
}

const navy = '#0e2440';
const amber = '#a35a00';
const amberSoft = '#f2e3cc';

const label: Record<string, string> = {
  'requirement-conflict': 'Requirement conflict',
  'obsolete-scope': 'Obsolete scope',
  'implementation-review': 'Implementation review',
  'insufficient-evidence': 'Uncertain — needs a human',
  unaffected: 'Unaffected control',
};

function FindingCard({ finding, onDismiss }: { finding: Finding; onDismiss: (f: Finding) => void }) {
  const uncertain = finding.classification === 'insufficient-evidence';
  return (
    <li style={{ listStyle: 'none', border: `1px solid ${amberSoft}`, borderLeft: `4px solid ${uncertain ? navy : amber}`, borderRadius: 8, padding: 16, marginBottom: 12, background: '#fffdf8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 14, color: navy }}>{label[finding.classification] ?? finding.classification}</strong>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#5b6b7c' }}>{finding.confidence} confidence</span>
      </div>
      <p style={{ margin: '8px 0', fontSize: 13, color: '#2a3a4a', lineHeight: 1.5 }}>{finding.rationale}</p>
      <blockquote style={{ margin: '8px 0', padding: '8px 12px', background: '#f7f5f0', borderLeft: `2px solid ${navy}`, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#2a3a4a' }}>
        {finding.sourceSpan.quote || 'source span unavailable'}
      </blockquote>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#5b6b7c', alignItems: 'center' }}>
        <span>
          {finding.issueKey} · {finding.criterionId} · source v{finding.sourceVersion}
        </span>
        <button
          onClick={() => onDismiss(finding)}
          style={{ marginLeft: 'auto', border: `1px solid ${navy}`, background: 'transparent', color: navy, borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Dismiss with reason
        </button>
      </div>
    </li>
  );
}

function App() {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { issueKey } = (await invoke('context')) as { issueKey: string };
      const result = (await invoke('issueFindings', { issueKey })) as Finding[];
      setFindings(result);
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
    await invoke('dismissFinding', { blockId: finding.criterionId.split(':')[0] ?? '', dedupe: finding.criterionId, reason });
    await load();
  };

  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', padding: 16, color: navy, background: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 10, background: amber, display: 'inline-block' }} />
        <h1 style={{ fontSize: 15, margin: 0, letterSpacing: 0.2 }}>DecisionFuse</h1>
      </header>

      {error && (
        <p role="alert" style={{ fontSize: 13, color: '#8a1c1c' }}>
          {error}
        </p>
      )}

      {findings === null && !error && <p style={{ fontSize: 13, color: '#5b6b7c' }}>Checking linked decisions…</p>}

      {findings !== null && findings.length === 0 && (
        <p style={{ fontSize: 13, color: '#5b6b7c' }}>No drift found for the linked decisions at their current versions.</p>
      )}

      {findings !== null && findings.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: '#5b6b7c', marginTop: 0 }}>
            {findings.length} finding{findings.length === 1 ? '' : 's'} need review. A model may propose; only an owner approves a write.
          </p>
          <ul style={{ padding: 0, margin: 0 }}>
            {findings.map((f) => (
              <FindingCard key={f.id} finding={f} onDismiss={dismiss} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
