import { useAuth } from '@clerk/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiRequestError, createApi, type Api } from './api'

export function useApi(): Api {
  const { getToken } = useAuth()
  return useMemo(() => createApi(() => getToken()), [getToken])
}

export function useLoad<T>(loader: (api: Api) => Promise<T>, deps: unknown[]) {
  const api = useApi()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiRequestError | null>(null)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    try { setData(await loader(api)); setError(null) }
    catch (e) { setError(e instanceof ApiRequestError ? e : new ApiRequestError(0, { code: 'NETWORK', message: String(e) })) }
    finally { setLoading(false) }
  }, [api, ...deps])
  useEffect(() => { void reload() }, [reload])
  return { data, error, loading, reload, api }
}
