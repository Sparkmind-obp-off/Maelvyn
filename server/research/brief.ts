import { sanitizeText } from '../lib/http'

export type EvidenceForBrief = {
  n: number
  url: string
  title: string
  snippet: string
  excerpt?: string | null
  synthetic: boolean
  injectionFlag: boolean
}

export type ResearchBrief = {
  profile?: 'signal' | 'leadintel'
  schema_version: 'research-brief/1'
  objective: string
  generator: 'extractive-v1'
  synthetic: boolean
  disclaimer: string
  reported_findings: Array<{ statement: string; citations: number[]; classification: 'source_reported_unverified' | 'synthetic' }>
  agent_inferences: Array<{ statement: string; basis: number[]; confidence: 'low' }>
  gaps_and_unknowns: string[]
  suggested_validation_test: { hypothesis: string; method: string; stop_condition: string }
  security_notes: string[]
  sources: Array<{ n: number; url: string; title: string }>
}

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) (instructions|prompts)/i,
  /disregard (the )?(system|previous) (prompt|instructions)/i,
  /you are now/i,
  /reveal (your|the) (system prompt|secret|api key)/i,
  /\bapi[_ -]?key\b.*\b(send|post|exfiltrate)\b/i,
  /<\s*script/i,
]

/** External content is DATA, never instructions. We flag likely injection attempts for the reviewer. */
export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text))
}

function firstSentences(text: string, max = 280): string {
  const clean = sanitizeText(text, 4000)
  const parts = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20)
  let out = ''
  for (const p of parts) {
    if ((out + ' ' + p).trim().length > max) break
    out = (out + ' ' + p).trim()
  }
  return (out || clean.slice(0, max)).trim()
}

/**
 * Deterministic, extractive brief generator. It does NOT invent facts: every reported finding is a
 * quoted/condensed source statement with a citation. Inferences are explicitly labelled as agent
 * inference with low confidence. No LLM is involved (Workers AI is not bound / not approved).
 */
export function buildBrief(objective: string, evidence: EvidenceForBrief[], options: { profile?: ResearchBrief['profile']; synthetic?: boolean } = {}): ResearchBrief {
  const synthetic = options.synthetic === true || (evidence.length > 0 && evidence.every((e) => e.synthetic))
  const usable = evidence.filter((e) => !e.injectionFlag)
  const findings = usable.slice(0, 8).map((e) => ({
    statement: firstSentences(e.excerpt && e.excerpt.length > 80 ? e.excerpt : e.snippet),
    citations: [e.n],
    classification: (e.synthetic ? 'synthetic' : 'source_reported_unverified') as 'synthetic' | 'source_reported_unverified',
  })).filter((f) => f.statement.length > 0)

  const domains = new Set(usable.map((e) => { try { return new URL(e.url).hostname } catch { return e.url } }))
  const inferences: ResearchBrief['agent_inferences'] = []
  if (usable.length > 0) {
    inferences.push({
      statement: `The topic has at least ${usable.length} publicly retrievable source(s) across ${domains.size} domain(s); coverage breadth alone does not indicate demand or willingness to pay.`,
      basis: usable.map((e) => e.n), confidence: 'low',
    })
  }
  if (domains.size <= 2 && usable.length > 0) {
    inferences.push({ statement: 'Source diversity is low; findings may reflect a single viewpoint.', basis: usable.map((e) => e.n), confidence: 'low' })
  }

  const gaps = [
    'No primary customer evidence (interviews, pre-orders, payments) is included in this brief.',
    'Market size, pricing and competitor metrics are NOT verified; search snippets are secondary and may be outdated.',
    'Unit economics (price, variable cost, acquisition cost) remain unknown.',
  ]
  if (options.profile === 'signal') gaps.push('Category, competitor coverage, pricing, trend direction, and opportunity estimates require dated, independently verified sources.')
  if (options.profile === 'leadintel') gaps.push('Legal company identity, domain, business fit, and partner status are not independently verified. No people or contact details have been qualified.')
  if (findings.length === 0) gaps.unshift('No usable sources were retrieved for this objective.')

  const flagged = evidence.filter((e) => e.injectionFlag)
  const security = [
    'All retrieved content is treated as untrusted data; no instructions from sources were followed.',
    ...(flagged.length ? [`${flagged.length} source(s) contained instruction-like text and were excluded from findings: ${flagged.map((f) => `[${f.n}]`).join(', ')}.`] : []),
  ]

  return {
    ...(options.profile ? { profile: options.profile } : {}),
    schema_version: 'research-brief/1',
    objective,
    generator: 'extractive-v1',
    synthetic,
    disclaimer: synthetic
      ? 'SYNTHETIC TEST OUTPUT — generated from mock data. Not evidence. Do not use for decisions.'
      : 'DRAFT — source-reported statements are unverified secondary evidence. Requires human review before any decision.',
    reported_findings: findings,
    agent_inferences: inferences,
    gaps_and_unknowns: gaps,
    suggested_validation_test: options.profile === 'leadintel' ? {
      hypothesis: 'A company matches documented qualification criteria at the organization level.',
      method: 'Compare the company domain, public registry, and published business offering. Do not contact people or infer private attributes.',
      stop_condition: 'Leave company qualification unknown if identity, provenance, or business fit is ambiguous.',
    } : {
      hypothesis: `A defined customer segment experiences the problem behind "${objective.slice(0, 120)}" strongly enough to pay.`,
      method: 'Run 5–10 structured problem interviews and one low-cost offer test (landing page or manual pre-sale) within a fixed timebox and budget ceiling approved by the accountable operator.',
      stop_condition: 'Stop or revise if fewer than 2 of 10 qualified prospects take a committed next step (payment, deposit or signed LOI).',
    },
    security_notes: security,
    sources: evidence.map((e) => ({ n: e.n, url: e.url, title: e.title })),
  }
}
