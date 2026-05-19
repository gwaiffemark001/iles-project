const ACCESS_KEY = 'access_token'


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
