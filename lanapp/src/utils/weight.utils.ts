import { Weight } from '../entities/weight.entity';

/**
 * Average daily weight gain (g/day) between the current weigh-in and the previous one.
 * Farm practice is periodic pesajes (weekly/monthly), not daily — this is not "gain since yesterday".
 */
export function calculateDailyGain(
    currentWeight: number,
    currentDate: Date,
    previousRecord: Weight | null
): number | undefined {
    if (!previousRecord) return undefined;

    const daysDiff =
        (new Date(currentDate).getTime() - new Date(previousRecord.measurementDate).getTime()) /
        (1000 * 60 * 60 * 24);

    if (daysDiff <= 0) return undefined;

    return ((currentWeight - Number(previousRecord.weight)) / daysDiff) * 1000;
}
