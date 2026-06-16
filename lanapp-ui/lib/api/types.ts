import type { Medicine, SheepJson } from "@sheep/domain"

/** Sheep row from GET /sheep (dates as ISO strings). */
export type ApiSheep = SheepJson & {
  currentLocationId?: string | null
  currentLocation?: { id: string; name: string } | null
  latestWeight?: number | string | null
  latestWeightDate?: string | null
}

export type ApiMedicine = Medicine & {
  notes?: string | null
}

export type ApiMedicineApplication = {
  id: string
  medicineId: string
  sheepId: string
  applicationDate: string
  nextApplicationDate?: string | null
  status: string
  notes?: string | null
  medicine?: ApiMedicine | null
  sheep?: { id: string; tag: string; name?: string | null } | null
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type BulkResultItem = {
  sheepId: string
  recordId: string
}

export type BulkFailure = {
  sheepId: string
  error: string
}

export type BulkResult = {
  succeeded: BulkResultItem[]
  failed: BulkFailure[]
  total: number
}

export type SheepTargetFilters = {
  gender?: string
  status?: string
  category?: string
  locationId?: string
}

export type SheepTarget = {
  sheepIds?: string[]
  filters?: SheepTargetFilters
}

export type ApiLocation = {
  id: string
  name: string
  address: string
  description?: string | null
  latitude?: number | null
  longitude?: number | null
}
