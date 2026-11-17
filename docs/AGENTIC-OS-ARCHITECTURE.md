# MAELVYN — Agentic Shared Venture Studio OS Architecture

**Version:** 1.0.0  
**Status:** Target architecture; implementation not yet provisioned  
**Canonical identity:** MAELVYN — Agentic Shared Venture Studio OS

## 1. Product definition

MAELVYN is a multi-agent operating system for a shared venture studio. It coordinates opportunity discovery, venture design, asset creation, launch, operations, finance preparation, growth, and portfolio intelligence through specialized agents working under explicit human authority.

The system is agentic in analysis and bounded execution—not autonomous in legal authority, ownership, capital custody, or binding commitments.

The foundational model remains:
- **Shared Economic Core:** common governance, permissions, financial controls, evidence, and portfolio coordination.
- **Active Venture Studio:** the venture lifecycle and execution method.
- **Venture Portfolio:** independently scoped ventures and productive assets.
- **Agentic OS:** the intelligence, orchestration, memory, tools, workflows, and audit capabilities that coordinate the above.

## 2. Seven-layer architecture

1. **Experience & Workspace Layer** — portfolio dashboard, venture workspaces, approvals, task inbox, agent activity, evidence, and reporting.
2. **MAELVYN Intelligence Core** — system context, strategy, policy retrieval, planning, memory selection, and model routing.
3. **Agent Orchestration Layer** — task decomposition, delegation, dependency graphs, routing, budgets, deadlines, retries, and escalation.
4. **Specialist Agent Layer** — role-scoped agents for governance, finance, opportunity, venture creation, assets, revenue, automation, and growth.
5. **Execution & Integration Layer** — typed tools, provider adapters, connectors, APIs, browser/research capabilities, and bounded action handlers.
6. **Durable Data & Workflow Layer** — D1 records, R2 artifacts, Queues for independent background jobs, Workflows for durable multi-step tasks and approvals, and Durable Objects for coordination where justified.
7. **Governance, Security & Audit Plane** — identity, permissions, consent, approvals, policy enforcement, audit events, cost controls, secrets brokering, and emergency stop.

The governance plane is cross-cutting and cannot be bypassed by an agent, prompt, tool, or workflow.

## 3. Agent topology

### Shared control-plane agents
- **Chief Orchestrator:** decomposes requests, creates task contracts, assigns specialist agents, resolves dependencies, and reports consolidated outcomes.
- **Governance & Policy Agent:** checks authority, policy, reserved matters, and approval requirements; cannot approve on behalf of rights-holders.
- **Portfolio Intelligence Agent:** summarizes portfolio evidence and risks using only authorized cross-venture data.
- **Provider & Cost Steward:** checks provider health, quotas, cost ceilings, fallbacks, and availability before dispatch.

### Specialist agent groups
- **Opportunity:** signal discovery, market research, customer problem analysis, competitor mapping, validation design.
- **Venture Creation:** business model, venture charter drafting, product requirements, solution design, build planning, launch readiness.
- **Operations:** SOPs, task coordination, service quality, incident triage, vendor workflow preparation.
- **Capital & Finance:** budget drafting, classification, reconciliations, variance analysis, cash forecasts, management reporting.
- **Assets & IP:** asset inventory, custody/use records, rights metadata, license and maintenance reminders.
- **Revenue:** offer design, pricing analysis, sales pipeline support, customer support drafts, collections monitoring.
- **Growth:** channel research, content planning, distribution experiments, retention and expansion analysis.
- **Automation & Reliability:** workflow proposals, connector health, retries, test runs, monitoring and recovery recommendations.

A venture may receive a dedicated agent team, but agents are logical roles, not assumed employees or legal representatives.

## 4. Venture isolation and shared intelligence

Every venture workspace must have:
- A stable venture ID and lifecycle state.
- Separate context, evidence, files, tasks, budgets, records, contributors, permissions, and audit trail.
- Explicit data classification and retention rules.
- A human operator and escalation contact.
- Tool allowlists and per-venture resource/cost ceilings.

Cross-venture access is denied by default. Shared agents may access only approved common policies and portfolio aggregates. Raw customer, participant, financial, credential, contract, and source data must not cross venture boundaries without explicit authorization and a documented purpose. Aggregates must be reviewed for re-identification risk.

## 5. Agent autonomy and authorization

| Level | Name | Permitted behavior |
|---|---|---|
| L1 | Assist | Read authorized context, explain, analyze, and answer |
| L2 | Prepare | Draft plans, records, code, messages, budgets, and approval requests; no external side effect |
| L3 | Bounded Execute | Perform explicitly pre-authorized, reversible, low-risk actions within tool, scope, and cost limits |
| L4 | Governed Autonomy | Run recurring approved workflows with monitoring, limits, audit, and automatic stop/escalation |

L4 is not blanket autonomy. Each workflow must be individually allowlisted, tested, revocable, and bounded.

Always require the authorized human approval for: ownership/equity changes; admitting investors or participants where rights change; debt, guarantees, or lending; payment initiation or transfer of money; profit distributions; sale/transfer/license of material assets or IP; signing or accepting legal terms; material participant obligations; legal-entity formation; and production changes with material financial/security impact.

An approval is scoped to a specific action, amount, venture, recipient, and validity window. No inferred, reused, or blanket consent.

## 6. Task contract

Every orchestrated task must carry:
- task_id, parent_task_id, venture_id (nullable only for shared control-plane tasks), requester, accountable human owner;
- objective, expected output, acceptance criteria, source-of-truth references;
- assigned agent role and model/provider policy;
- read scopes, tool allowlist, action scopes, autonomy level;
- data classification, deadline, retry policy, and cost/token ceiling;
- approval requirements and approval reference;
- status, evidence/artifact references, verification result, and audit correlation ID.

Agents may propose delegation. The orchestrator validates permissions and budget before dispatch. Child tasks inherit the narrowest parent scope; they can never widen it.

## 7. Memory and context governance

Use layered memory:
- **System memory:** approved constitutions, policies, architecture, and versioned prompts.
- **Venture memory:** venture-scoped decisions, assumptions, evidence, and operating context.
- **Task memory:** temporary working context and artifacts.
- **Agent runtime state:** operational state needed for recovery, not an independent source of truth.

Memory writes require provenance, scope, author/source, timestamp, confidence, sensitivity class, retention, and review/expiry rules. Corrections must preserve history. Do not silently turn speculation, chat content, or unapproved agent output into durable policy or participant facts. Retrieval must enforce venture and role permissions before content reaches a model.

## 8. Tool and provider gateway

Agents do not receive raw provider credentials. All tool calls pass through a server-side gateway that enforces identity, venture scope, allowlist, schema validation, rate limits, cost ceilings, idempotency, approval gates, and audit logging.

Provider adapters are modular. The initial preferred platform is Cloudflare-first:
- Workers + Hono for API and policy enforcement.
- D1 as canonical relational record store.
- R2 for private artifacts and generated files.
- Queues for independent asynchronous jobs.
- Workflows for durable multi-step processes, retries, sleeps, and human approval waits.
- Durable Objects for stateful agent coordination and real-time sessions where a proof of concept validates the need.
- Cloudflare Agents SDK is a candidate runtime, not a locked dependency until a small prototype passes evaluation.

Model, search, extraction, email, identity, and payment integrations remain provider-neutral adapters. Existing approved providers should be reused before adding a new provider. No paid actor, provider, or resource is invoked beyond an approved budget.

## 9. Execution safety and reliability

- Separate planning from action execution.
- Validate every tool input against a strict schema and policy.
- Use idempotency keys for external side effects; assume queue delivery can be repeated.
- Use durable checkpoints for long-running work and explicit compensation/reversal where possible.
- Retry only transient failures; exponential backoff with jitter; cap attempts.
- Use dead-letter handling and a human-visible failure queue.
- Circuit-break unhealthy providers and activate only approved fallbacks.
- Never let a model decide whether its own action is authorized.
- Verify outputs independently against acceptance criteria and source evidence.
- Stop on conflicting instructions, missing authority, ambiguous rights, unexpected cost, data leakage, or critical safety/security findings.

## 10. Agent evaluation and observability

Before production use, each agent and workflow needs:
- Versioned role prompt and tool schemas.
- Golden task set and adversarial permission tests.
- Correctness, groundedness, scope compliance, privacy leakage, cost, latency, and recovery evaluation.
- Human review for high-impact output.
- Trace IDs linking user request → plan → agent run → tool call → workflow → approval → artifact.
- Metrics for success/failure, retries, tool denial, escalations, cost, token usage, and human override.
- Kill switch and rollback procedure.

## 11. Core records (logical schema)

Minimum entities: AgentDefinition, AgentVersion, AgentRun, AgentMessage/Trace, Task, TaskDependency, ToolDefinition, ToolCall, PermissionGrant, ApprovalRequest, ApprovalDecision, WorkflowRun, Provider, ProviderCapability, ProviderUsage, MemoryItem, Evidence, Artifact, EvaluationRun, AuditEvent.

All records are venture-scoped where applicable. Audit events are append-only. Financial and approval records require immutable history and explicit corrections.

## 12. Rollout gates

1. **Design gate:** approve task contracts, permission matrix, memory boundaries, and data classification.
2. **Runtime proof of concept:** one read-only research agent + one orchestrator + one durable workflow; test retries, isolation, cost ceilings, and human approval.
3. **Internal alpha:** specialist agents in a sandbox, synthetic data only, no payment or external binding actions.
4. **Controlled pilot:** named human operators, approved ventures, explicit provider budgets, audit and incident process.
5. **Production readiness:** security review, privacy/terms review, restore test, evaluation thresholds, operational owner, rollback, and legal review where applicable.

This architecture is a target specification. It does not mean any agent runtime, provider, account, paid resource, or production deployment has been provisioned.
