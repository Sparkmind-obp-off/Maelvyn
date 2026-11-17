import type { D1Database } from '@cloudflare/workers-types'

/** Worker bindings. Secrets are only ever read server-side. */
export interface Env {
  DB: D1Database
  ASSETS?: { fetch: (req: Request) => Promise<Response> }
  APP_ENV: string
  ALLOW_SELF_SERVICE_WORKSPACES?: string
  SYSTEM_KILL_SWITCH?: string
  CLERK_ISSUER?: string
  CLERK_JWKS_URL?: string
  CLERK_PUBLISHABLE_KEY?: string
  CLERK_AUTHORIZED_PARTIES?: string
  CLERK_SECRET_KEY?: string
  TAVILY_API_KEY?: string
  FIRECRAWL_API_KEY?: string
  APIFY_TOKEN?: string
  SCRAPELY_API_KEY?: string
}

export type Principal = { personId: string; subject: string; displayName: string }

export type AppVariables = {
  requestId: string
  principal?: Principal
}

export type AppEnv = { Bindings: Env; Variables: AppVariables }
