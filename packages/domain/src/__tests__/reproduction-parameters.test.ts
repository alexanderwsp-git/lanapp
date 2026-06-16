import {
    DEFAULT_REPRODUCTION_PARAMETERS,
    addDaysToIso,
    expectedBirthFromMating,
    isOutsideEcoWindow,
    suggestedEcoWindow,
    suggestedRemateDate,
} from '../reproduction-parameters';

describe('reproduction-parameters', () => {
    it('uses default gestation of 147 days', () => {
        expect(DEFAULT_REPRODUCTION_PARAMETERS.gestationDays).toBe(147);
    });

    it('computes suggested ECO window 30–45 days after mating', () => {
        expect(suggestedEcoWindow('2026-01-01')).toEqual({
            min: '2026-01-31',
            max: '2026-02-15',
        });
    });

    it('computes expected birth from mating date', () => {
        expect(expectedBirthFromMating('2026-01-01')).toBe('2026-05-28');
    });

    it('addDaysToIso handles month boundaries', () => {
        expect(addDaysToIso('2026-01-28', 5)).toBe('2026-02-02');
    });

    it('flags check dates outside ECO window', () => {
        expect(isOutsideEcoWindow('2026-01-15', '2026-01-01')).toBe(true);
        expect(isOutsideEcoWindow('2026-02-01', '2026-01-01')).toBe(false);
        expect(isOutsideEcoWindow('2026-02-20', '2026-01-01')).toBe(true);
    });

    it('suggests remate after heat cycle days', () => {
        expect(suggestedRemateDate('2026-02-01')).toBe('2026-02-16');
    });
});
