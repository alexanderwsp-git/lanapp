"use client"

import { useCallback, useEffect, useState } from "react"
import { DEFAULT_REPRODUCTION_PARAMETERS, type ReproductionParameters } from "@sheep/domain"
import { fetchFarmParameters } from "@/lib/api/farm-parameters"

export function useReproductionParameters() {
  const [params, setParams] = useState<ReproductionParameters>(DEFAULT_REPRODUCTION_PARAMETERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFarmParameters()
      setParams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los parámetros")
      setParams(DEFAULT_REPRODUCTION_PARAMETERS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { params, loading, error, reload }
}
