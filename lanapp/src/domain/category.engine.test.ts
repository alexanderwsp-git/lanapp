import { Gender, SheepCategory } from '@sheep/domain';
import { determineCategory, ageInDays } from './category.engine';

describe('category.engine', () => {
    const ref = new Date('2024-07-01');

    it('assigns CORDERO/CORDERA before weaning', () => {
        const birth = new Date('2024-05-01');
        expect(determineCategory(Gender.MALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.CORDERO
        );
        expect(determineCategory(Gender.FEMALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.CORDERA
        );
    });

    it('assigns MALTÓN/MALTONA between weaning and 6 months only after weaning record', () => {
        const birth = new Date('2024-01-01');
        expect(determineCategory(Gender.MALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.CORDERO
        );
        expect(determineCategory(Gender.FEMALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.CORDERA
        );
        expect(
            determineCategory(Gender.MALE, birth, { referenceDate: ref, isWeaned: true })
        ).toBe(SheepCategory.CORDERO_DESTETADO);
        expect(
            determineCategory(Gender.FEMALE, birth, { referenceDate: ref, isWeaned: true })
        ).toBe(SheepCategory.CORDERA_DESTETADA);
    });

    it('assigns BORREGO/BORREGA between 6 and 12 months', () => {
        const birth = new Date('2023-10-01');
        expect(determineCategory(Gender.MALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.BORREGO
        );
        expect(determineCategory(Gender.FEMALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.BORREGA
        );
    });

    it('assigns REPRODUCTOR for selected males at 12+ months', () => {
        const birth = new Date('2023-01-01');
        expect(
            determineCategory(Gender.MALE, birth, {
                referenceDate: ref,
                isBreedingRam: true,
            })
        ).toBe(SheepCategory.REPRODUCTOR);
    });

    it('assigns reproductive female categories after 12 months with history', () => {
        const birth = new Date('2023-01-01');
        expect(
            determineCategory(Gender.FEMALE, birth, {
                referenceDate: ref,
                isPregnant: true,
            })
        ).toBe(SheepCategory.OVEJA_PRENADA);
        expect(
            determineCategory(Gender.FEMALE, birth, {
                referenceDate: ref,
                isLactating: true,
                hasReproductiveHistory: true,
            })
        ).toBe(SheepCategory.OVEJA_LACTANCIA);
        expect(
            determineCategory(Gender.FEMALE, birth, {
                referenceDate: ref,
                hasReproductiveHistory: true,
            })
        ).toBe(SheepCategory.OVEJA_VACIA);
    });

    it('keeps BORREGA at 12+ months without reproductive history', () => {
        const birth = new Date('2023-01-01');
        expect(determineCategory(Gender.FEMALE, birth, { referenceDate: ref })).toBe(
            SheepCategory.BORREGA
        );
        expect(
            determineCategory(Gender.FEMALE, birth, {
                referenceDate: ref,
                isLactating: true,
            })
        ).toBe(SheepCategory.BORREGA);
    });

    it('assigns BORREGA PREÑADA for young pregnant females', () => {
        const birth = new Date('2023-10-01');
        expect(
            determineCategory(Gender.FEMALE, birth, {
                referenceDate: ref,
                isPregnant: true,
            })
        ).toBe(SheepCategory.BORREGA_PRENADA);
    });

    it('computes age in days', () => {
        const birth = new Date('2024-06-01');
        expect(ageInDays(birth, new Date('2024-07-11'))).toBe(40);
    });
});
