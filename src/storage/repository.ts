import type { AuditRecord, Decision, DecisionLink, Finding, Proposal } from '../domain/types';

/** Minimal key/value contract so domain logic stays testable off-platform. */
export interface Kv {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Every key is prefixed with the tenant (site cloud id). Two sites sharing one
 * app installation never see each other's decisions, findings or audits.
 */
export class Repository {
  constructor(
    private readonly kv: Kv,
    private readonly tenantId: string,
  ) {}

  private key(...parts: string[]): string {
    return ['tenant', this.tenantId, ...parts].join(':');
  }

  async putDecision(decision: Decision): Promise<void> {
    assertTenant(decision.tenantId, this.tenantId);
    await this.kv.set(this.key('decision', decision.blockId), decision);
    // The list is what the issue panel and the approval path scan; a decision
    // that only exists under its own key is invisible to both.
    const decisions = await this.listDecisions();
    const next = decisions.filter((d) => d.blockId !== decision.blockId);
    next.push(decision);
    await this.kv.set(this.key('decisions'), next);
  }

  async getDecision(blockId: string): Promise<Decision | null> {
    return ((await this.kv.get(this.key('decision', blockId))) as Decision | undefined) ?? null;
  }

  async listDecisions(): Promise<Decision[]> {
    return ((await this.kv.get(this.key('decisions'))) as Decision[] | undefined) ?? [];
  }

  async putLink(link: DecisionLink): Promise<void> {
    assertTenant(link.tenantId, this.tenantId);
    const links = await this.linksForBlock(link.blockId);
    const next = links.filter((l) => !(l.issueKey === link.issueKey && l.criterionId === link.criterionId));
    next.push(link);
    await this.kv.set(this.key('links', link.blockId), next);
  }

  async linksForBlock(blockId: string): Promise<DecisionLink[]> {
    return ((await this.kv.get(this.key('links', blockId))) as DecisionLink[] | undefined) ?? [];
  }

  async putFinding(finding: Finding): Promise<void> {
    assertTenant(finding.tenantId, this.tenantId);
    const findings = await this.listFindings(finding.blockId);
    const next = findings.filter((f) => f.dedupeKey !== finding.dedupeKey);
    next.push(finding);
    await this.kv.set(this.key('findings', finding.blockId), next);
  }

  async listFindings(blockId: string): Promise<Finding[]> {
    return ((await this.kv.get(this.key('findings', blockId))) as Finding[] | undefined) ?? [];
  }

  async findFinding(dedupe: string, blockId: string): Promise<Finding | null> {
    const findings = await this.listFindings(blockId);
    return findings.find((f) => f.dedupeKey === dedupe) ?? null;
  }

  async putProposal(proposal: Proposal): Promise<void> {
    assertTenant(proposal.tenantId, this.tenantId);
    await this.kv.set(this.key('proposal', proposal.id), proposal);
  }

  async getProposal(id: string): Promise<Proposal | null> {
    return ((await this.kv.get(this.key('proposal', id))) as Proposal | undefined) ?? null;
  }

  async markProposalConsumed(hash: string): Promise<void> {
    const used = ((await this.kv.get(this.key('consumed'))) as string[] | undefined) ?? [];
    if (!used.includes(hash)) {
      used.push(hash);
      await this.kv.set(this.key('consumed'), used);
    }
  }

  async consumedProposalHashes(): Promise<Set<string>> {
    return new Set(((await this.kv.get(this.key('consumed'))) as string[] | undefined) ?? []);
  }

  async appendAudit(record: AuditRecord): Promise<void> {
    assertTenant(record.tenantId, this.tenantId);
    const log = ((await this.kv.get(this.key('audit'))) as AuditRecord[] | undefined) ?? [];
    log.push(record);
    await this.kv.set(this.key('audit'), log.slice(-500));
  }

  async listAudit(): Promise<AuditRecord[]> {
    return ((await this.kv.get(this.key('audit'))) as AuditRecord[] | undefined) ?? [];
  }
}

function assertTenant(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error('Tenant mismatch: refusing to write across installations');
  }
}
