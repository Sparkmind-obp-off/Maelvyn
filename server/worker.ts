import { createApp } from './app'
import type { Env } from './env'

const app = createApp()

/** Cloudflare Pages advanced-mode worker: /api/* → Hono; everything else → static assets (SPA). */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return app.fetch(request, env, ctx)
    if (!env.ASSETS) return new Response('Not found', { status: 404 })
    return env.ASSETS.fetch(request)
  },
}
