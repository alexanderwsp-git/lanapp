export enum DiagnosisType {
    ECO = 'ECO',
    /** Manual pregnancy check (no ultrasound). */
    MANUAL = 'Manual',
    /** Legacy manual pregnancy check — display only; migrated to ECO. */
    CONTROL_MONTA = 'Control Monta',
    /** Legacy — was misused for pregnancy; use Analysis FAMACHA for anemia. Migrated to ECO. */
    FAMACHA = 'FAMACHA',
}

/** Pregnancy diagnosis methods allowed on Montas / Planificador. */
export const PREGNANCY_DIAGNOSIS_TYPES = [DiagnosisType.ECO, DiagnosisType.MANUAL] as const;

export enum BreedingResult {
    PREGNANT = 'Pregnant',
    EMPTY = 'Empty',
    RECHECK = 'Recheck',
}

/** Planner row lifecycle — use Cancelled instead of hard delete (same pattern as medicine). */
export enum BreedingCycleStatus {
    ACTIVE = 'Active',
    CANCELLED = 'Cancelled',
}

/** Distinguish diagnosis checks from birth (parto) events in history. */
export enum PregnancyCheckKind {
    DIAGNOSIS = 'Diagnosis',
    DELIVERY = 'Delivery',
}
