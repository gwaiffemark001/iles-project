// Utility function to format dates in a user-friendly way
export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === '') return ''
// Handle invalid date formats gracefully
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
// Use the user's locale for formatting, with sensible defaults
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
//alternative code
/*
// Utility function to format dates in a user-friendly way
export function formatDate(value, options = {}) {
  if (!value || value === undefined || value === '') return ''
// Handle invalid date formats gracefully
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
// Use the user's locale for formatting, with sensible defaults
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
  */