"use client"

import { useCallback, useEffect, useState } from "react"
import type { ApiAnalysis } from "@/lib/analysis/types"
import { fetchAnalysesBySheep } from "@/lib/api/analysis"
import { fetchMedicineApplicationsBySheep } from "@/lib/api/medicine"
import { fetchSheepById, fetchSheepFamily, type ApiSheepFamily } from "@/lib/api/sheep"
import type { ApiMedicineApplication, ApiSheep } from "@/lib/api/types"
import { fetchWeaningRecordsBySheep, type ApiWeaningRecord } from "@/lib/api/weaning"
import { fetchWeightsBySheep, type ApiWeight } from "@/lib/api/weight"

function sortMedicineApps(list: ApiMedicineApplication[]): ApiMedicineApplication[] {
  return [...list].sort(
    (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
  )
}

function sortAnalyses(list: ApiAnalysis[]): ApiAnalysis[] {
  return [...list].sort((a, b) => {
    const ad = a.completedDate ?? a.scheduledDate
    const bd = b.completedDate ?? b.scheduledDate
    return new Date(bd).getTime() - new Date(ad).getTime()
  })
}

async function loadSheepDetailData(sheepId: string) {
  return Promise.allSettled([
    fetchSheepById(sheepId),
    fetchSheepFamily(sheepId),
    fetchWeaningRecordsBySheep(sheepId),
    fetchWeightsBySheep(sheepId),
    fetchMedicineApplicationsBySheep(sheepId),
    fetchAnalysesBySheep(sheepId),
  ])
}

export function useSheepDetailPage(sheepId: string) {
  const [sheep, setSheep] = useState<ApiSheep | null>(null)
  const [family, setFamily] = useState<ApiSheepFamily | null>(null)
  const [weaningRecords, setWeaningRecords] = useState<ApiWeaningRecord[]>([])
  const [weightRecords, setWeightRecords] = useState<ApiWeight[]>([])
  const [weightError, setWeightError] = useState<string | null>(null)
  const [medicineApplications, setMedicineApplications] = useState<ApiMedicineApplication[]>([])
  const [analyses, setAnalyses] = useState<ApiAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyResults = useCallback(
    (
      results: Awaited<ReturnType<typeof loadSheepDetailData>>,
    ) => {
      const [
        sheepResult,
        familyResult,
        weaningResult,
        weightsResult,
        medicineResult,
        analysesResult,
      ] = results

      if (sheepResult.status === "fulfilled") {
        setSheep(sheepResult.value)
      } else {
        setSheep(null)
        setError(
          sheepResult.reason instanceof Error
            ? sheepResult.reason.message
            : "No se pudo cargar la oveja",
        )
      }

      if (familyResult.status === "fulfilled") {
        setFamily(familyResult.value)
      } else {
        setFamily({ children: [] })
      }

      if (weaningResult.status === "fulfilled") {
        setWeaningRecords(weaningResult.value)
      } else {
        setWeaningRecords([])
      }

      if (weightsResult.status === "fulfilled") {
        setWeightRecords(weightsResult.value)
      } else {
        setWeightRecords([])
        setWeightError(
          weightsResult.reason instanceof Error
            ? weightsResult.reason.message
            : "No se pudieron cargar los pesajes",
        )
      }

      if (medicineResult.status === "fulfilled") {
        setMedicineApplications(sortMedicineApps(medicineResult.value))
      } else {
        setMedicineApplications([])
      }

      if (analysesResult.status === "fulfilled") {
        setAnalyses(sortAnalyses(analysesResult.value))
      } else {
        setAnalyses([])
      }
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)
    setWeightError(null)

    void (async () => {
      const results = await loadSheepDetailData(sheepId)
      if (cancelled) return
      applyResults(results)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [sheepId, applyResults])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    setWeightError(null)

    const results = await loadSheepDetailData(sheepId)
    applyResults(results)
    setLoading(false)
  }, [sheepId, applyResults])

  const reloadSheep = useCallback(async () => {
    try {
      setSheep(await fetchSheepById(sheepId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la oveja")
    }
  }, [sheepId])

  const reloadFamily = useCallback(async () => {
    try {
      setFamily(await fetchSheepFamily(sheepId))
    } catch {
      setFamily({ children: [] })
    }
  }, [sheepId])

  const reloadWeaning = useCallback(async () => {
    try {
      setWeaningRecords(await fetchWeaningRecordsBySheep(sheepId))
    } catch {
      setWeaningRecords([])
    }
  }, [sheepId])

  const reloadWeights = useCallback(async () => {
    setWeightError(null)
    try {
      setWeightRecords(await fetchWeightsBySheep(sheepId))
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : "No se pudieron cargar los pesajes")
      setWeightRecords([])
    }
  }, [sheepId])

  const reloadMedicine = useCallback(async () => {
    try {
      setMedicineApplications(sortMedicineApps(await fetchMedicineApplicationsBySheep(sheepId)))
    } catch {
      setMedicineApplications([])
    }
  }, [sheepId])

  const reloadAnalyses = useCallback(async () => {
    try {
      setAnalyses(sortAnalyses(await fetchAnalysesBySheep(sheepId)))
    } catch {
      setAnalyses([])
    }
  }, [sheepId])

  return {
    sheep,
    family,
    offspring: family?.children ?? [],
    weaningRecords,
    weightRecords,
    weightError,
    setWeightRecords,
    medicineApplications,
    analyses,
    loading,
    error,
    reloadSheep,
    reloadFamily,
    reloadWeaning,
    reloadWeights,
    reloadMedicine,
    reloadAnalyses,
    reloadAll: loadAll,
  }
}
