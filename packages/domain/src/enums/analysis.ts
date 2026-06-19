/** Catalog kind for analysis types (FAMACHA anemia, coprological, etc.). */
export enum AnalysisKind {
    FAMACHA = 'FAMACHA',
    COPROLOGICAL = 'COPROLOGICAL',
    BODY_CONDITION = 'BODY_CONDITION',
    BLOOD = 'BLOOD',
    OTHER = 'OTHER',
}

export enum AnalysisStatus {
    SCHEDULED = 'Scheduled',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    MISSED = 'Missed',
}
