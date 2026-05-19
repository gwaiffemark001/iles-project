export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === '') return ''

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',

      ...options,
    })
  } catch {
    return ''
  }
}