import { Gender, SheepBreed, SheepCategory, SheepStatus } from '@sheep/domain';
import { determineCategory, CategoryContext, ageInDays } from '../domain/category.engine';

export { determineCategory, CategoryContext, ageInDays };

/**
 * Calculates the quarantine end date (7 days from birth)
 */
export function calculateQuarantineEndDate(birthDate: Date): Date {
    const quarantineEndDate = new Date(birthDate);
    quarantineEndDate.setDate(quarantineEndDate.getDate() + 7);
    return quarantineEndDate;
}

/**
 * Determines if a sheep is in quarantine based on its birth date
 */
export function isInQuarantine(birthDate: Date): boolean {
    const quarantineEndDate = calculateQuarantineEndDate(birthDate);
    return new Date() < quarantineEndDate;
}

export { Gender, SheepBreed, SheepCategory, SheepStatus };
