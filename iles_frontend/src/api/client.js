const DEFAULT_BASE_URL = ''

function joinUrl(baseUrl, path) {
  const base = (baseUrl || '').replace(/\/+$/, '')
  const p = (path || '').replace(/^\/+/, '')
  if (!base) return `/${p}`
  return `${base}/${p}`
}

async function readJsonSafely(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  try {
    const text = await response.text()
    return text ? { detail: text } : null
  } catch {
    return null
  }
}

function normalizeErrorPayload(payload) {
  if (!payload) return { message: 'Request failed.' }
  if (typeof payload === 'string') return { message: payload }
  if (typeof payload.detail === 'string' && payload.detail.includes('<!DOCTYPE html>')) {
    return {
      message: 'Server error. Check backend server and database connection.',
      details: payload,
    }
  }
  if (payload.message) return { message: payload.message, details: payload }
  if (payload.detail) return { message: payload.detail, details: payload }
  const firstKey = Object.keys(payload)[0]
  if (firstKey) {
    const val = payload[firstKey]
    const msg = Array.isArray(val) ? val[0] : String(val)
    return { message: msg, details: payload }
  }
  return { message: 'Request failed.', details: payload }
}

function createHttpError({ status, payload }) {
  const normalized = normalizeErrorPayload(payload)
  const error = new Error(normalized.message)
  error.status = status
  error.payload = payload
  error.details = normalized.details
  return error
}

export function createApiClient({
  baseUrl = DEFAULT_BASE_URL,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} = {}) {
  const cfg = {
    baseUrl,
    getAccessToken: getAccessToken || (() => null),
    getRefreshToken: getRefreshToken || (() => null),
    setTokens: setTokens || (() => {}),
    clearTokens: clearTokens || (() => {}),
  }

  async function refreshAccessToken() {
    const refresh = cfg.getRefreshToken()
    if (!refresh) return null

    const res = await fetch(joinUrl(cfg.baseUrl, 'api/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    const payload = await readJsonSafely(res)
    if (!res.ok) return null

    const access = payload?.access
    if (access) cfg.setTokens({ access, refresh })
    return access || null
  }

  async function request(path, { method = 'GET', body, headers, auth = true } = {}) {
    const url = joinUrl(cfg.baseUrl, path)

    const token = auth ? cfg.getAccessToken() : null
    const finalHeaders = {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (res.status === 401 && auth) {
      const newAccess = await refreshAccessToken()
      if (newAccess) {
        const retryRes = await fetch(url, {
          method,
          headers: {
            ...finalHeaders,
            Authorization: `Bearer ${newAccess}`,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const retryPayload = await readJsonSafely(retryRes)
        if (!retryRes.ok) throw createHttpError({ status: retryRes.status, payload: retryPayload })
        return retryPayload
      }

      cfg.clearTokens()
    }

    const payload = await readJsonSafely(res)
    if (!res.ok) throw createHttpError({ status: res.status, payload })
    return payload
  }

  return {
    request,
    get: (path, opts) => request(path, { ...(opts || {}), method: 'GET' }),
    post: (path, body, opts) => request(path, { ...(opts || {}), method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...(opts || {}), method: 'PUT', body }),
    del: (path, opts) => request(path, { ...(opts || {}), method: 'DELETE' }),
  }
}

