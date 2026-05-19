import { useCallback, useState } from "react";

function useFetch(fetchFn) {
    const [loading, setLoading] = useState(false)
    const [error, seterror] = useState(null)
}

export default useFetch