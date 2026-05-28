/*
 useMount Hook
 Checks if component is mounted
 Prevents state updates on unmounted components
 */

import { useEffect, useRef, useCallback } from 'react'

export const useMount = () => {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}

export default useMount