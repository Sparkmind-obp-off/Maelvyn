#!/usr/bin/env node
/**
 * MAELVYN Connect local MCP bridge.
 * Credentials are read only from environment variables and never stored in this repository.
 * Write calls stay disabled unless MAELVYN_CONNECT_ALLOW_WRITES=true is explicitly set.
 */
import readline from 'node:readline'

const baseUrl = (process.env.MAELVYN_CONNECT_BASE_URL || '').replace(/\/$/, '')
const token = process.env.MAELVYN_CONNECT_TOKEN || ''
const allowWrites = process.env.MAELVYN_CONNECT_ALLOW_WRITES === 'true'
if (!baseUrl || !token) {
  process.stderr.write('MAELVYN Connect requires MAELVYN_CONNECT_BASE_URL and MAELVYN_CONNECT_TOKEN.\n')
  process.exit(1)
}

const tools = [
  { name: 'maelvyn_get_connect_manifest', description: 'Read the private Connect capability and security contract.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'maelvyn_list_registry', description: 'Read scoped projects, providers, tasks, and documentation.', inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' }, include: { type: 'string', description: 'Comma-separated: projects,providers,tasks,docs' } }, required: ['workspace_id'], additionalProperties: false } },
  { name: 'maelvyn_list_status_proposals', description: 'Read auditable status proposals for a workspace.', inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' } }, required: ['workspace_id'], additionalProperties: false } },
  { name: 'maelvyn_propose_task_status', description: 'Record a scoped status proposal for human review; never mutates a task directly.', inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' }, venture_id: { type: 'string' }, task_id: { type: 'string' }, title: { type: 'string' }, requested_status: { type: 'string', enum: ['proposed', 'in_progress', 'blocked', 'done', 'needs_review'] }, note: { type: 'string' }, confirm: { type: 'boolean', description: 'Must be true for a write proposal.' } }, required: ['workspace_id', 'venture_id', 'title', 'requested_status', 'confirm'], additionalProperties: false } },
]

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}
function validString(value, label, max = 2000) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > max) throw new Error(`${label} is required.`)
  return value.trim()
}
async function request(path, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${baseUrl}/api/v1${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    const body = await response.json().catch(() => ({ error: { message: 'Invalid JSON response.' } }))
    if (!response.ok) throw new Error(body?.error?.message || `MAELVYN Connect returned ${response.status}.`)
    return body
  } finally {
    clearTimeout(timer)
  }
}
async function callTool(name, args) {
  if (name === 'maelvyn_get_connect_manifest') return request('/connect/manifest')
  if (name === 'maelvyn_list_registry') {
    const workspaceId = encodeURIComponent(validString(args?.workspace_id, 'workspace_id', 120))
    const include = args?.include ? `&include=${encodeURIComponent(validString(args.include, 'include', 120))}` : ''
    return request(`/connect/registry?workspace_id=${workspaceId}${include}`)
  }
  if (name === 'maelvyn_list_status_proposals') {
    const workspaceId = encodeURIComponent(validString(args?.workspace_id, 'workspace_id', 120))
    return request(`/connect/status-proposals?workspace_id=${workspaceId}`)
  }
  if (name === 'maelvyn_propose_task_status') {
    if (!allowWrites) throw new Error('Write tools are disabled. Set MAELVYN_CONNECT_ALLOW_WRITES=true only for an explicitly scoped, auditable session.')
    if (args?.confirm !== true) throw new Error('confirm=true is required for a write proposal.')
    const payload = {
      workspace_id: validString(args?.workspace_id, 'workspace_id', 120),
      venture_id: validString(args?.venture_id, 'venture_id', 120),
      task_id: args?.task_id ? validString(args.task_id, 'task_id', 120) : undefined,
      title: validString(args?.title, 'title', 160),
      requested_status: validString(args?.requested_status, 'requested_status', 40),
      note: args?.note ? validString(args.note, 'note', 2000) : undefined,
      source: 'mcp',
    }
    return request('/connect/status-proposals', { method: 'POST', body: JSON.stringify(payload) })
  }
  throw new Error(`Unknown tool: ${name}`)
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
for await (const line of rl) {
  if (!line.trim()) continue
  let message
  try { message = JSON.parse(line) } catch { process.stdout.write(JSON.stringify(jsonRpcError(null, -32700, 'Parse error.')) + '\n'); continue }
  const id = message.id ?? null
  try {
    if (message.method === 'initialize') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'maelvyn-connect', version: '1.0.0' } } }) + '\n')
    } else if (message.method === 'notifications/initialized') {
      // Notification: no response.
    } else if (message.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { tools } }) + '\n')
    } else if (message.method === 'tools/call') {
      const result = await callTool(message.params?.name, message.params?.arguments || {})
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result } }) + '\n')
    } else {
      process.stdout.write(JSON.stringify(jsonRpcError(id, -32601, 'Method not found.')) + '\n')
    }
  } catch (error) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Request failed.' }] } }) + '\n')
  }
}
