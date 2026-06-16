import type { ReactNode } from "react"
import {
  CalendarDaysIcon,
  HeartIcon,
  TagIcon,
} from "@heroicons/react/20/solid"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { formatDisplayDate } from "@/lib/format"
import { labelDiagnosisType } from "@/lib/labels/breeding"
import {
  PregnancyCheckKind,
  deriveMatingPhase,
  deliveryCheck,
  hasConfirmedPregnancy,
  latestDiagnosis,
  MATING_PHASE_LABELS,
  type MatingPhase,
} from "@sheep/domain"

function diagnosisResultLabel(check: ApiPregnancyCheck): string {
  if (check.isPregnant) return "Preñada"
  if (check.nextCheckDate) return "Revisar"
  return "Vacía"
}

function diagnosisResultDot(check: ApiPregnancyCheck): string {
  if (check.isPregnant) return "fill-pink-500"
  if (check.nextCheckDate) return "fill-yellow-500"
  return "fill-red-500"
}

function displayNotes(notes?: string | null): string | undefined {
  if (!notes?.trim()) return undefined
  const stripped = notes.replace(/^\[(ECO|FAMACHA|Control Monta)\]\s*/i, "").trim()
  return stripped || undefined
}

function ResultPill({ label, dotClass }: { label: string; dotClass: string }) {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-gray-200 ring-inset">
      <svg viewBox="0 0 6 6" aria-hidden="true" className={`size-1.5 ${dotClass}`}>
        <circle r={3} cx={3} cy={3} />
      </svg>
      {label}
    </span>
  )
}

function TypePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 ring-inset">
      {label}
    </span>
  )
}

function FeedIcon({ children }: { children: ReactNode }) {
  return (
    <div className="relative px-1">
      <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white outline -outline-offset-1 outline-black/5">
        {children}
      </div>
    </div>
  )
}

export function matingPhaseBadgeColor(phase: MatingPhase): "green" | "red" | "yellow" | "gray" | "indigo" {
  switch (phase) {
    case "pregnant":
    case "delivered":
      return "green"
    case "empty":
      return "red"
    case "recheck":
      return "yellow"
    case "awaiting_diagnosis":
      return "gray"
    default:
      return "indigo"
  }
}

export function matingPhaseSummary(checks: ApiPregnancyCheck[]): {
  phase: MatingPhase
  label: string
  color: ReturnType<typeof matingPhaseBadgeColor>
  detail?: string
} {
  const phase = deriveMatingPhase(checks)
  const label = MATING_PHASE_LABELS[phase]
  const color = matingPhaseBadgeColor(phase)

  const delivery = deliveryCheck(checks)
  const dx = latestDiagnosis(checks)

  if (phase === "delivered" && delivery) {
    return { phase, label, color, detail: formatDisplayDate(delivery.checkDate) }
  }
  if (dx) {
    const type = dx.checkType ? labelDiagnosisType(dx.checkType as ApiPregnancyCheck["checkType"]) : "Chequeo"
    return {
      phase,
      label,
      color,
      detail: `${type} · ${formatDisplayDate(dx.checkDate)}`,
    }
  }
  return { phase, label, color }
}

export type MatingActivityFeedProps = {
  checks: ApiPregnancyCheck[]
  /** Optional first row: monta registration */
  mating?: {
    matingDate: string
    partnerLabel?: string
  }
}

/** Activity-feed style history: monta + diagnoses + parto. */
export function MatingActivityFeed({ checks, mating }: MatingActivityFeedProps) {
  const sorted = [...checks].sort((a, b) => a.checkDate.localeCompare(b.checkDate))

  type FeedItem =
    | { id: string; kind: "mating"; date: string; partnerLabel?: string }
    | { id: string; kind: "diagnosis"; check: ApiPregnancyCheck; priorChecks: ApiPregnancyCheck[] }
    | { id: string; kind: "delivery"; check: ApiPregnancyCheck }

  const items: FeedItem[] = []

  if (mating) {
    items.push({
      id: "mating",
      kind: "mating",
      date: mating.matingDate,
      partnerLabel: mating.partnerLabel,
    })
  }

  for (const check of sorted) {
    const priorChecks = sorted.filter(
      (c) => c.checkDate < check.checkDate || (c.checkDate === check.checkDate && c.id < check.id),
    )
    if (check.kind === PregnancyCheckKind.DELIVERY) {
      items.push({ id: check.id, kind: "delivery", check })
    } else {
      items.push({ id: check.id, kind: "diagnosis", check, priorChecks })
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Sin eventos registrados.</p>
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-6">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={item.id}>
              <div className={`relative ${isLast ? "pb-0" : "pb-6"}`}>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  {item.kind === "mating" && (
                    <>
                      <FeedIcon>
                        <HeartIcon aria-hidden="true" className="size-5 text-pink-500" />
                      </FeedIcon>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">Monta registrada</span>
                          {item.partnerLabel && (
                            <>
                              {" "}
                              · <span className="font-medium text-gray-900">{item.partnerLabel}</span>
                            </>
                          )}
                          <span className="whitespace-nowrap"> · {formatDisplayDate(item.date)}</span>
                        </p>
                      </div>
                    </>
                  )}

                  {item.kind === "diagnosis" && (
                    <>
                      <FeedIcon>
                        <TagIcon aria-hidden="true" className="size-5 text-gray-500" />
                      </FeedIcon>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">Diagnóstico</span>
                          <span className="whitespace-nowrap"> · {formatDisplayDate(item.check.checkDate)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {item.check.checkType && (
                            <TypePill label={labelDiagnosisType(item.check.checkType)} />
                          )}
                          <ResultPill
                            label={diagnosisResultLabel(item.check)}
                            dotClass={diagnosisResultDot(item.check)}
                          />
                        </div>
                        {item.check.nextCheckDate && (
                          <p className="mt-2 text-sm text-gray-600">
                            Próximo chequeo: {formatDisplayDate(item.check.nextCheckDate)}
                            {hasConfirmedPregnancy(item.priorChecks) && !item.check.isPregnant && (
                              <span className="text-gray-500"> · La oveja sigue preñada</span>
                            )}
                          </p>
                        )}
                        {displayNotes(item.check.notes) && (
                          <p className="mt-2 text-sm text-gray-700">{displayNotes(item.check.notes)}</p>
                        )}
                      </div>
                    </>
                  )}

                  {item.kind === "delivery" && (
                    <>
                      <FeedIcon>
                        <CalendarDaysIcon aria-hidden="true" className="size-5 text-indigo-500" />
                      </FeedIcon>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">Parto registrado</span>
                          <span className="whitespace-nowrap"> · {formatDisplayDate(item.check.checkDate)}</span>
                        </div>
                        <div className="mt-2">
                          <ResultPill label="Parto" dotClass="fill-indigo-500" />
                        </div>
                        {displayNotes(item.check.notes) && (
                          <p className="mt-2 text-sm text-gray-700">{displayNotes(item.check.notes)}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** @deprecated Use MatingActivityFeed */
export function MatingTimeline(props: MatingActivityFeedProps) {
  return <MatingActivityFeed {...props} />
}
