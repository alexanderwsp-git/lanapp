import type { ApiSheep } from "./types"
import * as mock from "@/mocks/handlers/breeding-weaning"
import * as real from "./real/weaning"
import { resolveApi } from "./resolve"

export type ApiWeaningRecord = {
  id: string
  sheepId: string
  weaningDate: string
  weaningWeight: number
  dailyGain?: number | null
  lotId?: string | null
  notes?: string | null
}

export type ApiRecentWeaningRecord = ApiWeaningRecord & {
  tag: string
  name?: string | null
  category: string
  birthDate: string
  gender: string
}

export type WeaningRecentQuery = {
  fromDate?: string
  toDate?: string
  days?: number
}

export type BulkWeaningRecordItem = {
  sheepId: string
  weaningWeight: number
  notes?: string
}

export type BulkWeaningPayload = {
  weaningDate: string
  lotId?: string
  notes?: string
  records?: BulkWeaningRecordItem[]
  sheepIds?: string[]
  filters?: {
    gender?: string
    status?: string
    category?: string
    locationId?: string
  }
  defaultWeight?: number
}

export const {
  bulkRecordWeaning,
  fetchWeaningAlerts,
  fetchRecentWeanings,
  fetchWeaningRecordsBySheep,
} = resolveApi(real, mock)
