import { BreedingResult, DiagnosisType } from '@sheep/domain';

export function breedingResultToCheckInput(
    result: BreedingResult,
    nextCheckDate?: Date
): { isPregnant: boolean; nextCheckDate?: Date } {
    if (result === BreedingResult.PREGNANT) {
        return { isPregnant: true };
    }
    if (result === BreedingResult.RECHECK) {
        return { isPregnant: false, nextCheckDate };
    }
    return { isPregnant: false };
}

export function checkToBreedingResult(
    isPregnant: boolean,
    nextCheckDate?: Date | null
): BreedingResult {
    if (isPregnant) return BreedingResult.PREGNANT;
    if (nextCheckDate) return BreedingResult.RECHECK;
    return BreedingResult.EMPTY;
}

export function formatCheckNotes(checkType: DiagnosisType | undefined, notes?: string): string | undefined {
    const prefix = checkType ? `[${checkType}]` : undefined;
    if (prefix && notes) return `${prefix} ${notes}`;
    if (prefix) return prefix;
    return notes;
}
