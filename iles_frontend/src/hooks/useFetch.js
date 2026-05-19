import { useCallback, useState } from "react";

function useFetch(fetchFn) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const execute = useCallback(
        async (...args) => {
            setLoading(true)
            setError(null)

            try{
                const result = await fetchFn(...args)
                return result
            }   catch (err) {
                setError(err?.message || 'Request failed!') 
                throw err
            }   finally {
                setLoading(false)
            }
        }, 
        [fetchFn],
    )
    return { 
        execute, 
        loading, 
        error, 
        clearError: () => setError(null),
    }
}

export default useFetch