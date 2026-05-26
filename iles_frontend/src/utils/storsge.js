//storage.js - Utility functions for managing authentication tokens and user roles in localStorage
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const ROLE_KEY = 'role'

// Functions to get, set, and clear tokens and roles in localStorage
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
// Clear all authentication-related data from localStorage
export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')

}
