# MAELVYN Connect

**Status:** IMPLEMENTED IN SOURCE / NOT CONNECTED TO CHATGPT

MAELVYN Connect is a private REST and local MCP integration layer for the existing MAELVYN operating workspace. It exposes scoped registries for projects, providers, tasks, and documentation, plus a human-reviewable status-proposal workflow. It does not create a marketplace, pooled fund, payment capability, ownership relationship, or automatic venture funding path.

## Verified scope

The implementation is mounted under the existing authenticated `/api/v1` API. Every Connect request requires a verified Clerk Bearer token. Workspace and venture permissions are resolved from database membership and venture assignment. Client-supplied role, workspace, and venture claims are not trusted.

The default operating mode is read-only. `GET /api/v1/connect/manifest` describes the capability contract. `GET /api/v1/connect/registry?workspace_id=<id>` returns only the caller's permitted workspace/venture projections and never returns provider secret references or credential values. The optional `include` query accepts `projects`, `providers`, `tasks`, and `docs`. `GET /api/v1/connect/status-proposals?workspace_id=<id>` reads the caller's permitted proposals.

The only write operation is `POST /api/v1/connect/status-proposals`. It requires venture-management scope, validates the workspace/venture/task relationship, stores a pending proposal, and appends an audit event. It never mutates core task status automatically. Human review remains required. D1-backed rate limiting is applied by the shared API primitives to future write expansions; no unauthenticated write endpoint exists.

## Tool catalog

| Tool | Access | Behavior |
|---|---|---|
| `maelvyn_get_connect_manifest` | Read | Returns the security contract and tool catalog. |
| `maelvyn_list_registry` | Read | Returns scoped projects, providers, tasks, and docs. |
| `maelvyn_list_status_proposals` | Read | Returns scoped pending and historical proposals visible to the caller. |
| `maelvyn_propose_task_status` | Write | Records a status proposal for human review; does not apply the status. |

## Local MCP setup

The stdio bridge is `connect/mcp-server.mjs` and uses only the Node.js standard library. It is intentionally not enabled by an environment variable committed to the repository. Provide a base URL and a short-lived, least-privilege Clerk session token through the local process environment:

```bash
export MAELVYN_CONNECT_BASE_URL="https://<approved-maelvyn-origin>"
export MAELVYN_CONNECT_TOKEN="<short-lived-clerk-session-token>"
node connect/mcp-server.mjs
```

Example client configuration shape:

```json
{
  "mcpServers": {
    "maelvyn-connect": {
      "command": "node",
      "args": ["/absolute/path/to/Maelvyn/connect/mcp-server.mjs"],
      "env": {
        "MAELVYN_CONNECT_BASE_URL": "https://<approved-maelvyn-origin>",
        "MAELVYN_CONNECT_TOKEN": "${MAELVYN_CONNECT_TOKEN}"
      }
    }
  }
}
```

The bridge stays read-only unless `MAELVYN_CONNECT_ALLOW_WRITES=true` is explicitly set for the local process. A write call also requires `confirm=true` and is forwarded as `source: "mcp"`; the server still enforces venture-management authorization, validation, audit logging, and human review. Never commit the token, add it to a URL, or place it in a project file.

## Security model

Least privilege is enforced in layers. Transport uses HTTPS in the intended deployment. Authentication uses the existing Clerk verifier. Authorization uses database-backed workspace roles and venture memberships. Registry responses are projections rather than raw tables and omit secrets. Writes are narrowly scoped to status proposals, use server-generated opaque identifiers, validate task ownership within the venture, and create append-only audit evidence. Shared request IDs make actions traceable without exposing credentials. Errors are safe and do not disclose provider secrets or cross-venture existence.

A production connection additionally requires the existing release gates: a configured Clerk production secret, authorized parties, complete migrations, private artifact storage where required, and a verified target origin. This repository does not claim that ChatGPT or any other external assistant is connected; no supported MCP connection has been configured or tested against a live origin.

## Local tests

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

The Connect tests cover unauthenticated rejection, workspace/venture scoping, secret-reference omission, viewer write denial, auditable proposal creation, and proposal reads. The local MCP process can be smoke-tested with JSON-RPC lines only after supplying a real short-lived token through the environment; no token is included in repository examples.

## Known limitations

The bridge is a local stdio adapter, not a hosted MCP endpoint. It does not automatically apply task status, send messages, manage documents, or execute provider calls. The documentation registry is a curated code-level index of repository documents, not a file browser. UiChemy remains a separate builder project and was not modified because the authenticated edit path was unavailable to this session.
