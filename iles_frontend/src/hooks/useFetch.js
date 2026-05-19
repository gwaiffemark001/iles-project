import { useCallback, useState } from "react";

function useFetch(fetchFn) {
    const [loading, setLoading] = useState(false)
    const [error, seterror] = useState(null)

    const execute = useCallback(
        async (...args) => {
            setLoading(true)
            seterror(null)

            try{
                const result = await fetchFn(...args)
                return result
            }   catch (err) {
                
            }
        }, 
        [fetchFn],
    )
}

export default useFetch