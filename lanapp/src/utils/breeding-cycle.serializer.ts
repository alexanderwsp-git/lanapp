import { BreedingCycle } from '../entities/breeding-cycle.entity';

/** Flatten confirmed mating date for API consumers (planned date stays on matingDate). */
export function serializeBreedingCycle(cycle: BreedingCycle) {
    const matingDate = cycle.mating?.matingDate;
    const confirmed =
        matingDate instanceof Date
            ? matingDate.toISOString().slice(0, 10)
            : matingDate
              ? String(matingDate).slice(0, 10)
              : null;

    return {
        ...cycle,
        confirmedMatingDate: confirmed,
    };
}

export function serializeBreedingCycles(cycles: BreedingCycle[]) {
    return cycles.map(serializeBreedingCycle);
}
