import {
    Gender,
    SheepCategory,
    SIX_MONTHS_DAYS,
    TWELVE_MONTHS_DAYS,
    WEANING_DAYS,
} from '@sheep/domain';

export interface CategoryContext {
    isPregnant?: boolean;
    isLactating?: boolean;
    isBreedingRam?: boolean;
    /** Montas, preñez confirmada o parto — required for OVEJA_* adult categories. */
    hasReproductiveHistory?: boolean;
    /** True when a weaning_record exists — destetado is event-driven, not age-only. */
    isWeaned?: boolean;
    referenceDate?: Date;
}

export function ageInDays(birthDate: Date, referenceDate: Date = new Date()): number {
    const birth = new Date(birthDate);
    return Math.floor((referenceDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determines sheep category per official Granja San Alfonso status flow (70 d / 6 mo / 12 mo).
 */
export function determineCategory(
    gender: Gender,
    birthDate: Date,
    context: CategoryContext = {}
): SheepCategory {
    const referenceDate = context.referenceDate ?? new Date();
    const days = ageInDays(birthDate, referenceDate);

    if (gender === Gender.MALE) {
        if (days < WEANING_DAYS) return SheepCategory.CORDERO;
        if (days < SIX_MONTHS_DAYS) {
            return context.isWeaned ? SheepCategory.CORDERO_DESTETADO : SheepCategory.CORDERO;
        }
        if (days < TWELVE_MONTHS_DAYS) return SheepCategory.BORREGO;
        if (context.isBreedingRam) return SheepCategory.REPRODUCTOR;
        return SheepCategory.BORREGO;
    }

    if (days < WEANING_DAYS) return SheepCategory.CORDERA;
    if (days < SIX_MONTHS_DAYS) {
        return context.isWeaned ? SheepCategory.CORDERA_DESTETADA : SheepCategory.CORDERA;
    }

    if (days < TWELVE_MONTHS_DAYS) {
        if (context.isPregnant) return SheepCategory.BORREGA_PRENADA;
        return SheepCategory.BORREGA;
    }

    if (context.isPregnant) return SheepCategory.OVEJA_PRENADA;
    if (context.isLactating && context.hasReproductiveHistory) {
        return SheepCategory.OVEJA_LACTANCIA;
    }
    if (context.hasReproductiveHistory) return SheepCategory.OVEJA_VACIA;
    return SheepCategory.BORREGA;
}
