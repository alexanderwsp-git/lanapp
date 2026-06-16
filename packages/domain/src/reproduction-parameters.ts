import { z } from 'zod';

export const ReproductionParametersSchema = z
    .object({
        gestationDays: z.number().int().min(100).max(180),
        ecoCheckMinDays: z.number().int().min(1).max(90),
        ecoCheckMaxDays: z.number().int().min(1).max(120),
        heatCycleDays: z.number().int().min(1).max(60),
        weaningDays: z.number().int().min(40).max(120),
    })
    .refine(data => data.ecoCheckMaxDays >= data.ecoCheckMinDays, {
        message: 'ecoCheckMaxDays must be >= ecoCheckMinDays',
        path: ['ecoCheckMaxDays'],
    });

export type ReproductionParameters = z.infer<typeof ReproductionParametersSchema>;

export const DEFAULT_REPRODUCTION_PARAMETERS: ReproductionParameters = {
    gestationDays: 147,
    ecoCheckMinDays: 30,
    ecoCheckMaxDays: 45,
    heatCycleDays: 15,
    weaningDays: 70,
};

/** @deprecated Use DEFAULT_REPRODUCTION_PARAMETERS.gestationDays or farm parameters. */
export const LEGACY_GESTATION_DAYS = 150;

export function addDaysToIso(isoDate: string, days: number): string {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function suggestedEcoWindow(
    matingDate: string,
    params: ReproductionParameters = DEFAULT_REPRODUCTION_PARAMETERS
): { min: string; max: string } {
    return {
        min: addDaysToIso(matingDate, params.ecoCheckMinDays),
        max: addDaysToIso(matingDate, params.ecoCheckMaxDays),
    };
}

export function expectedBirthFromMating(
    matingDate: string,
    params: ReproductionParameters = DEFAULT_REPRODUCTION_PARAMETERS
): string {
    return addDaysToIso(matingDate, params.gestationDays);
}

export function suggestedRemateDate(
    emptyCheckDate: string,
    params: ReproductionParameters = DEFAULT_REPRODUCTION_PARAMETERS
): string {
    return addDaysToIso(emptyCheckDate, params.heatCycleDays);
}

export function isOutsideEcoWindow(
    checkDate: string,
    matingDate: string,
    params: ReproductionParameters = DEFAULT_REPRODUCTION_PARAMETERS
): boolean {
    const { min, max } = suggestedEcoWindow(matingDate, params);
    return checkDate < min || checkDate > max;
}
