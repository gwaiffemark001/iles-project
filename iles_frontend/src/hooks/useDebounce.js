/*
useDebounce Hook
Debounces a value, triggering changes after a delay
Useful for search inputs and other high-frequency updates
*/

import { useState, useEffect } from 'react'

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes (also on component unmount)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce