import type { ReactNode } from "react"
import {
  BeakerIcon,
  HeartIcon,
  SunIcon,
} from "@heroicons/react/20/solid"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { formatDisplayDate, formatRelativeDate } from "@/lib/format"
import { labelDiagnosisType } from "@/lib/labels/breeding"
import {
  hasConfirmedPregnancy,
  PregnancyCheckKind,
} from "@sheep/domain"
import { matingPhaseBadgeColor, matingPhaseSummary } from "@/lib/labels/mating"

export { matingPhaseBadgeColor, matingPhaseSummary }

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
  const stripped = notes.replace(/^\[(ECO|Manual|FAMACHA|Control Monta)\]\s*/i, "").trim()
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

function NoteComment({ note, author, date }: { note: string; author?: string; date?: string }) {
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
      {(author || date) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm">
            <span className="font-semibold text-gray-900">{author ?? "Nota"}</span>
            <span className="text-gray-500"> registró</span>
          </span>
          {date && <span className="whitespace-nowrap text-xs text-gray-400">{formatRelativeDate(date)}</span>}
        </div>
      )}
      <p className="text-sm whitespace-pre-line text-gray-600">{note}</p>
    </div>
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">Monta registrada</span>
                            {item.partnerLabel && (
                              <>
                                {" "}
                                · <span className="font-medium text-gray-900">{item.partnerLabel}</span>
                              </>
                            )}
                          </p>
                          <span className="whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(item.date)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {item.kind === "diagnosis" && (
                    <>
                      <FeedIcon>
                        <BeakerIcon aria-hidden="true" className="size-4 text-gray-500" />
                      </FeedIcon>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-medium text-gray-900">Diagnóstico</span>
                            {item.check.checkType && (
                              <TypePill label={labelDiagnosisType(item.check.checkType)} />
                            )}
                            <ResultPill
                              label={diagnosisResultLabel(item.check)}
                              dotClass={diagnosisResultDot(item.check)}
                            />
                          </div>
                          <span className="whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(item.check.checkDate)}
                          </span>
                        </div>
                        {item.check.nextCheckDate && (
                          <p className="mt-1.5 text-sm text-gray-600">
                            Próximo chequeo: {formatDisplayDate(item.check.nextCheckDate)}
                            {hasConfirmedPregnancy(item.priorChecks) && !item.check.isPregnant && (
                              <span className="text-gray-500"> · La oveja sigue preñada</span>
                            )}
                          </p>
                        )}
                        {displayNotes(item.check.notes) && (
                          <NoteComment
                            note={displayNotes(item.check.notes)!}
                            author={item.check.checkType ? labelDiagnosisType(item.check.checkType) : "Chequeo"}
                            date={item.check.checkDate}
                          />
                        )}
                      </div>
                    </>
                  )}

                  {item.kind === "delivery" && (
                    <>
                      <FeedIcon>
                        <SunIcon aria-hidden="true" className="size-4 text-amber-500" />
                      </FeedIcon>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-medium text-gray-900">Parto registrado</span>
                            <ResultPill label="Parto" dotClass="fill-indigo-500" />
                          </div>
                          <span className="whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(item.check.checkDate)}
                          </span>
                        </div>
                        {displayNotes(item.check.notes) && (
                          <NoteComment
                            note={displayNotes(item.check.notes)!}
                            author="Parto"
                            date={item.check.checkDate}
                          />
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
