import { BreedingResult, PregnancyCheckKind } from './enums/breeding';

export type MatingPhase =
    | 'awaiting_diagnosis'
    | 'recheck'
    | 'pregnant'
    | 'empty'
    | 'delivered';

export interface MatingCheckLike {
    checkDate: string | Date;
    isPregnant: boolean;
    nextCheckDate?: string | Date | null;
    kind?: PregnancyCheckKind | string | null;
    checkType?: string | null;
}

function checkTime(d: string | Date): number {
    return new Date(d).getTime();
}

function diagnosisRank(check: MatingCheckLike): number {
    if (!check.isPregnant && !check.nextCheckDate) return 0;
    if (!check.isPregnant && check.nextCheckDate) return 1;
    return 2;
}

function sortChecksDesc(checks: MatingCheckLike[]): MatingCheckLike[] {
    return [...checks].sort((a, b) => {
        const byDate = checkTime(b.checkDate) - checkTime(a.checkDate);
        if (byDate !== 0) return byDate;
        return diagnosisRank(a) - diagnosisRank(b);
    });
}

export function isDeliveryCheck(check: MatingCheckLike): boolean {
    return check.kind === PregnancyCheckKind.DELIVERY;
}

export function diagnosisChecks(checks: MatingCheckLike[]): MatingCheckLike[] {
    return checks.filter(c => !isDeliveryCheck(c));
}

export function deliveryCheck(checks: MatingCheckLike[]): MatingCheckLike | null {
    const deliveries = checks.filter(isDeliveryCheck);
    if (deliveries.length === 0) return null;
    return sortChecksDesc(deliveries)[0];
}

export function latestDiagnosis(checks: MatingCheckLike[]): MatingCheckLike | null {
    const dx = diagnosisChecks(checks);
    if (dx.length === 0) return null;
    return sortChecksDesc(dx)[0];
}

/** True if any diagnosis on this mating confirmed pregnancy (ECO Preñada). */
export function hasConfirmedPregnancy(checks: MatingCheckLike[]): boolean {
    return diagnosisChecks(checks).some(c => c.isPregnant);
}

function latestIsDefinitiveEmpty(latest: MatingCheckLike): boolean {
    return !latest.isPregnant && !latest.nextCheckDate;
}

/** Derive the current reproductive step for a mating from its check history. */
export function deriveMatingPhase(checks: MatingCheckLike[]): MatingPhase {
    if (deliveryCheck(checks)) return 'delivered';

    const latest = latestDiagnosis(checks);
    if (!latest) return 'awaiting_diagnosis';

    // After first Preñada, stay pregnant through follow-up Revisar checks until Vacía or parto.
    if (hasConfirmedPregnancy(checks)) {
        if (latestIsDefinitiveEmpty(latest)) return 'empty';
        return 'pregnant';
    }

    if (latest.isPregnant) return 'pregnant';
    if (latest.nextCheckDate) return 'recheck';
    return 'empty';
}

export function canRecordDiagnosis(
    phase: MatingPhase,
    result: BreedingResult
): { ok: true } | { ok: false; reason: string } {
    if (phase === 'delivered') {
        return { ok: false, reason: 'Esta monta ya tiene parto registrado. No se pueden agregar más diagnósticos.' };
    }
    if (phase === 'empty') {
        return {
            ok: false,
            reason: 'Esta monta fue marcada vacía. Programa una nueva monta para reintentar.',
        };
    }
    if (phase === 'pregnant' && result === BreedingResult.PREGNANT) {
        return {
            ok: false,
            reason: 'La preñez ya está confirmada en esta monta. Registre seguimiento (Revisar), Vacía o parto.',
        };
    }
    return { ok: true };
}

export function canRecordDelivery(
    phase: MatingPhase
): { ok: true } | { ok: false; reason: string } {
    if (phase === 'delivered') {
        return { ok: false, reason: 'El parto ya fue registrado para esta monta.' };
    }
    if (phase !== 'pregnant') {
        return {
            ok: false,
            reason: 'Solo se puede registrar parto después de confirmar preñez (ECO positivo).',
        };
    }
    return { ok: true };
}

export const MATING_PHASE_LABELS: Record<MatingPhase, string> = {
    awaiting_diagnosis: 'Pendiente diagnóstico',
    recheck: 'Revisar',
    pregnant: 'Preñada',
    empty: 'Vacía',
    delivered: 'Parto registrado',
};
