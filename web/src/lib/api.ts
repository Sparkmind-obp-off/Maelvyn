export type ApiError = { code: string; message: string; details?: Record<string, unknown>; request_id?: string }

export class ApiRequestError extends Error {
  constructor(public status: number, public error: ApiError) { super(error.message) }
}

export type TokenGetter = () => Promise<string | null>

export function createApi(getToken: TokenGetter) {
  async function request<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    const token = await getToken()
    const res = await fetch(`/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = (json as { error?: ApiError; request_id?: string })
      throw new ApiRequestError(res.status, { ...(err.error ?? { code: 'INTERNAL_ERROR', message: `HTTP ${res.status}` }), request_id: err.request_id })
    }
    return json as T
  }
  return {
    get: <T,>(p: string) => request<T>('GET', p),
    post: <T,>(p: string, b?: unknown, h?: Record<string, string>) => request<T>('POST', p, b ?? {}, h),
    put: <T,>(p: string, b: unknown) => request<T>('PUT', p, b),
  }
}

export type Api = ReturnType<typeof createApi>

export function newIdempotencyKey(): string {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return 'idk_' + Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}
