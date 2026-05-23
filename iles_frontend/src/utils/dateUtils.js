// Utility function to format dates in a user-friendly way
export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === '') return ''

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    })
  } catch {
    return ''
  }
}

export function formatTime(value, options = {}) {
  if (value === null || value === undefined || value === '') return ''

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    })
  } catch {
    return ''
  }
}
