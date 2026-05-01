import { useCallback, useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/client'
import AuthContext from './AuthContext'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const ROLE_KEY = 'role'

function getStoredAccess() {
  return localStorage.getItem(ACCESS_KEY)
}

function getStoredRefresh() {
  return localStorage.getItem(REFRESH_KEY)
}

function setStoredTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem(ROLE_KEY)
}

export function AuthProvider({ children }) {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || ''

  const [accessToken, setAccessToken] = useState(getStoredAccess())
  const [refreshToken, setRefreshToken] = useState(getStoredRefresh())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setTokens = useCallback(
    ({ access, refresh }) => {
      if (access !== undefined && access !== null) setAccessToken(access)
      if (refresh !== undefined && refresh !== null) setRefreshToken(refresh)
      setStoredTokens({ access, refresh })
    },
    [setAccessToken, setRefreshToken],
  )

  const logout = useCallback(() => {
    clearStoredTokens()
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }, [])

  const api = useMemo(() => {
    return createApiClient({
      baseUrl,
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      setTokens,
      clearTokens: logout,
    })
  }, [accessToken, refreshToken, baseUrl, setTokens, logout])

  const fetchProfile = useCallback(async () => {
    const profile = await api.get('api/profile/')
    setUser(profile)
    if (profile?.role) localStorage.setItem(ROLE_KEY, profile.role)
    return profile
  }, [api])

  const login = useCallback(
    async ({ usernameOrEmail, username, password }) => {
      const raw = (usernameOrEmail || username || '').trim()
      const loginName = raw.includes('@') ? raw.split('@')[0] : raw

      const tokenPayload = await api.post(
        'api/token/',
        { username: loginName, password },
        { auth: false },
      )

      const access = tokenPayload?.access
      const refresh = tokenPayload?.refresh
      if (!access || !refresh) {
        throw new Error('Login failed: missing tokens from server.')
      }

      setTokens({ access, refresh })
      const authenticatedApi = createApiClient({
        baseUrl,
        getAccessToken: () => access,
        getRefreshToken: () => refresh,
        setTokens,
        clearTokens: logout,
      })
      const profile = await authenticatedApi.get('api/profile/')
      setUser(profile)
      if (profile?.role) localStorage.setItem(ROLE_KEY, profile.role)

      return { success: true, user: profile, ...profile }
    },
    [api, baseUrl, logout, setTokens],
  )

  const register = useCallback(
    async ({ email, password, role, ...extra }) => {
      const cleanedEmail = (email || '').trim()
      const username = cleanedEmail.includes('@') ? cleanedEmail.split('@')[0] : cleanedEmail

      const allowedExtras = [
        'first_name',
        'last_name',
        'phone',
        'department',
        'staff_number',
        'student_number',
        'registration_number',
      ]
      const safeExtra = Object.fromEntries(
        Object.entries(extra || {}).filter(([k, v]) => allowedExtras.includes(k) && v !== undefined),
      )

      await api.post(
        'api/register/',
        {
          username,
          email: cleanedEmail,
          password,
          ...(role ? { role } : {}),
          ...safeExtra,
        },
        { auth: false },
      )

      return await login({ usernameOrEmail: username, password })
    },
    [api, login],
  )

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        if (!getStoredAccess() && !getStoredRefresh()) {
          if (!cancelled) setLoading(false)
          return
        }

        if (getStoredAccess()) {
          await fetchProfile()
          if (!cancelled) setLoading(false)
          return
        }

        await api.get('api/profile/')
      } catch {
        logout()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [api, fetchProfile, logout])

  const value = useMemo(() => {
    return {
      api,
      user,
      role: user?.role || localStorage.getItem(ROLE_KEY) || null,
      accessToken,
      refreshToken,
      loading,
      isAuthenticated: Boolean(accessToken),
      login,
      register,
      logout,
      fetchProfile,
    }
  }, [api, user, accessToken, refreshToken, loading, login, register, logout, fetchProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}



