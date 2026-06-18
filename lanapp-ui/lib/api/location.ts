import * as mock from "@/mocks/handlers/location"
import * as real from "./real/location"
import { resolveApi } from "./resolve"

export const {
  fetchLocations,
  fetchLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} = resolveApi(real, mock)
