import { useMocks } from "./config"

/** Pick mock or real implementation once per entity module. */
export function resolveApi<T extends Record<string, (...args: never[]) => unknown>>(real: T, mock: T): T {
  return useMocks() ? mock : real
}
