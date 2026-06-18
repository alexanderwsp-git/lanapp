export enum DiagnosisType {
    ECO = 'ECO',
    CONTROL_MONTA = 'Control Monta',
    FAMACHA = 'FAMACHA',
}

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
