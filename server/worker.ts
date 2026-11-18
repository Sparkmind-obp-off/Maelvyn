import { createApp } from './app'
import type { Env } from './env'

const app = createApp()

/**
 * Environment-derived Content-Security-Policy.
 * The Clerk frontend API origin is read from the deployment's own configuration, so Production
 * never authorizes a Development Clerk domain (and vice versa). No environment domain is hardcoded.
 */
export function contentSecurityPolicy(env: Env): string {
  const clerk = env.CLERK_ISSUER ? new URL(env.CLERK_ISSUER).origin : ''
  const clerkSources = [clerk, 'https://challenges.cloudflare.com', 'https://*.protect.clerk.com'].filter(Boolean)
  const script = ["'self'", ...clerkSources]
  const connect = ["'self'", ...clerkSources, ...(clerk ? [`${clerk.replace('https://', 'wss://')}`] : [])]
  const frame = ["'self'", ...clerkSources]
  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    `connect-src ${connect.join(' ')}`,
    "img-src 'self' data: https://img.clerk.com",
    "style-src 'self' 'unsafe-inline'",
    `frame-src ${frame.join(' ')}`,
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ')
}

/** Applies security headers to every response the Worker returns (API and static assets). */
export function withSecurityHeaders(res: Response, env: Env): Response {
  const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers })
  out.headers.set('X-Content-Type-Options', 'nosniff')
  out.headers.set('X-Frame-Options', 'DENY')
  out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  out.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  out.headers.set('Content-Security-Policy', contentSecurityPolicy(env))
  // HTML entry point must never be cached across releases (asset URLs are content-hashed).
  const ct = out.headers.get('Content-Type') ?? ''
  if (ct.includes('text/html')) out.headers.set('Cache-Control', 'no-store')
  return out
}

/** Cloudflare Pages advanced-mode worker: /api/* → Hono; everything else → static assets (SPA). */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const res = url.pathname.startsWith('/api/')
      ? await app.fetch(request, env, ctx)
      : env.ASSETS
        ? await env.ASSETS.fetch(request)
        : new Response('Not found', { status: 404 })
    return withSecurityHeaders(res, env)
  },
}
