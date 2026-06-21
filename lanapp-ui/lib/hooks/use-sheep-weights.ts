"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchWeightsBySheep, type ApiWeight } from "@/lib/api/weight"

export function useSheepWeights(sheepId: string) {
  const [records, setRecords] = useState<ApiWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeightsBySheep(sheepId)
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pesajes")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { records, loading, error, reload, setRecords }
}
