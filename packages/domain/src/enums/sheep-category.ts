/** Official Spanish categories per Granja San Alfonso status-flow (ARCHITECTURE_PLAN Section 5). */
export enum SheepCategory {
    // Male
    CORDERO = 'CORDERO',
    CORDERO_DESTETADO = 'CORDERO DESTETADO (MALTÓN)',
    BORREGO = 'BORREGO',
    REPRODUCTOR = 'REPRODUCTOR',
    FAENADO = 'FAENADO',

    // Female
    CORDERA = 'CORDERA',
    CORDERA_DESTETADA = 'CORDERA DESTETADA (MALTONA)',
    BORREGA = 'BORREGA',
    BORREGA_PRENADA = 'BORREGA PREÑADA',
    OVEJA_PRENADA = 'OVEJA PREÑADA',
    OVEJA_LACTANCIA = 'OVEJA LACTANCIA',
    OVEJA_VACIA = 'OVEJA VACÍA',
    FAENADA = 'FAENADA',

    // Disposition (both sexes)
    VENTA = 'VENTA',
}

export const WEANING_DAYS = 70;
export const SIX_MONTHS_DAYS = 183;
export const TWELVE_MONTHS_DAYS = 365;
