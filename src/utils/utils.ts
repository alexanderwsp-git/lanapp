import { Gender, SheepBreed, SheepCategory, SheepStatus } from '@awsp__/utils';

/**
 * Calculates the quarantine end date (7 days from birth)
 * @param birthDate - The date when the sheep was born
 * @returns The date when quarantine ends
 */
export function calculateQuarantineEndDate(birthDate: Date): Date {
    const quarantineEndDate = new Date(birthDate);
    quarantineEndDate.setDate(quarantineEndDate.getDate() + 7);
    return quarantineEndDate;
}

/**
 * Determines if a sheep is in quarantine based on its birth date
 * @param birthDate - The date when the sheep was born
 * @returns true if the sheep is still in quarantine
 */
export function isInQuarantine(birthDate: Date): boolean {
    const quarantineEndDate = calculateQuarantineEndDate(birthDate);
    return new Date() < quarantineEndDate;
}

/**
 * Determines the category of a sheep based on its gender, age, pregnancy status, and birth history
 * @param gender - The gender of the sheep (MALE or FEMALE)
 * @param birthDate - The date when the sheep was born
 * @param isPregnant - Whether the sheep is currently pregnant
 * @param hasGivenBirth - Whether the sheep has given birth before
 * @returns The appropriate SheepCategory based on the sheep's characteristics
 */
export function determineCategory(
    gender: Gender,
    birthDate: Date,
    isPregnant: boolean,
    hasGivenBirth: boolean
): SheepCategory {
    const ageInMonths =
        (new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (gender === Gender.MALE) {
        if (ageInMonths < 2.5) return SheepCategory.LAMB_MALE;
        if (ageInMonths < 6) return SheepCategory.WEANED_LAMB_MALE;
        if (ageInMonths < 12) return SheepCategory.RAM;
        return SheepCategory.BREEDING_RAM;
    } else {
        if (ageInMonths < 2.5) return SheepCategory.LAMB_FEMALE;
        if (ageInMonths < 6) return SheepCategory.WEANED_LAMB_FEMALE;
        if (isPregnant) return SheepCategory.PREGNANT_EWE;
        if (hasGivenBirth) return SheepCategory.LACTATING_EWE;
        return SheepCategory.EMPTY_EWE;
    }
}
