const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const ROLE_KEY = 'role'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}
 export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function saveTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)

}

export function saveRole(role) {
  if (role) localStorage.setItem(ROLE_KEY, role)
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem('token')

}
