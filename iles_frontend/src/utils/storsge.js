const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const ROLE_KEY = 'role'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}


export function saveTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)

}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem('token')

}
