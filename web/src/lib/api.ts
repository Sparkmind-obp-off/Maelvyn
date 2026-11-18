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
  /** Binary upload: the body is sent verbatim (never JSON-wrapped or re-encoded). */
  async function upload<T>(path: string, file: File): Promise<T> {
    const token = await getToken()
    const res = await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: file,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = (json as { error?: ApiError; request_id?: string })
      throw new ApiRequestError(res.status, { ...(err.error ?? { code: 'INTERNAL_ERROR', message: `HTTP ${res.status}` }), request_id: err.request_id })
    }
    return json as T
  }

  /** Authenticated download: fetches bytes with the session token, then triggers a save. */
  async function download(path: string, filename: string): Promise<void> {
    const token = await getToken()
    const res = await fetch(`/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      const err = (json as { error?: ApiError; request_id?: string })
      throw new ApiRequestError(res.status, { ...(err.error ?? { code: 'INTERNAL_ERROR', message: `HTTP ${res.status}` }), request_id: err.request_id })
    }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return {
    get: <T,>(p: string) => request<T>('GET', p),
    post: <T,>(p: string, b?: unknown, h?: Record<string, string>) => request<T>('POST', p, b ?? {}, h),
    put: <T,>(p: string, b: unknown) => request<T>('PUT', p, b),
    patch: <T,>(p: string, b: unknown) => request<T>('PATCH', p, b),
    del: <T,>(p: string) => request<T>('DELETE', p),
    upload,
    download,
  }
}

export type Api = ReturnType<typeof createApi>

export function newIdempotencyKey(): string {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return 'idk_' + Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}
