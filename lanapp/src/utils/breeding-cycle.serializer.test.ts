import { describe, expect, it } from '@jest/globals';
import { serializeBreedingCycle } from '../utils/breeding-cycle.serializer';
import { BreedingCycle } from '../entities/breeding-cycle.entity';

describe('serializeBreedingCycle', () => {
    it('exposes confirmedMatingDate from linked mating without changing planned matingDate', () => {
        const cycle = {
            id: 'cycle-1',
            matingDate: new Date('2026-03-01'),
            mating: { matingDate: new Date('2026-03-10') },
        } as BreedingCycle;

        const out = serializeBreedingCycle(cycle);

        expect(out.matingDate).toEqual(new Date('2026-03-01'));
        expect(out.confirmedMatingDate).toBe('2026-03-10');
    });

    it('returns null confirmedMatingDate when mating is not linked', () => {
        const cycle = {
            id: 'cycle-2',
            matingDate: new Date('2026-03-01'),
        } as BreedingCycle;

        expect(serializeBreedingCycle(cycle).confirmedMatingDate).toBeNull();
    });
});
