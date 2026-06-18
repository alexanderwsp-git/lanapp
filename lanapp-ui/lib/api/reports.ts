import type { ReportConfig, ReportType } from "@/mocks/data/reports"
import * as mock from "@/mocks/handlers/reports"
import * as real from "./real/reports"
import { resolveApi } from "./resolve"

export type { ReportConfig, ReportType }

export const { fetchReport } = resolveApi(real, mock)
