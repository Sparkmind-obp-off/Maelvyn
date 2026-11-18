import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

/** Worker bindings. Secrets are only ever read server-side. */
export interface Env {
  DB: D1Database
  /** Private R2 bucket (Production only). Never public; accessed exclusively server-side. */
  ARTIFACTS?: R2Bucket
  ASSETS?: { fetch: (req: Request) => Promise<Response> }
  APP_ENV: string
  SYSTEM_KILL_SWITCH?: string
  PLATFORM_OWNER_EMAIL?: string
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

export type Principal = { personId: string; subject: string; displayName: string; email: string | null; emailVerified: boolean }

export type AppVariables = {
  requestId: string
  principal?: Principal
  refreshProfile?: () => Promise<Principal>
}

export type AppEnv = { Bindings: Env; Variables: AppVariables }
