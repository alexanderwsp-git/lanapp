import type { ApiPendingDelivery } from "./real/births"
import * as mock from "@/mocks/handlers/births"
import * as real from "./real/births"
import { resolveApi } from "./resolve"

export type { ApiPendingDelivery }

export const { fetchPendingDeliveries } = resolveApi(real, mock)
