import { BaseService } from './base.service';
import { WeightRepository } from '../repositories/weight.repository';
import { SheepRepository } from '../repositories/sheep.repository';
import { Weight } from '../entities/weight.entity';
import { calculateDailyGain } from '../utils/weight.utils';

export type SheepWithLatestWeight<T> = T & {
    latestWeight: number | null;
    latestWeightDate: Date | null;
};

export class WeightService extends BaseService<Weight> {
    constructor() {
        super(new WeightRepository());
    }

    async findBySheep(sheepId: string): Promise<Weight[]> {
        return (this.repository as WeightRepository).findBySheep(sheepId);
    }

    async findLatestBySheep(sheepId: string): Promise<Weight | null> {
        return (this.repository as WeightRepository).findLatestBySheep(sheepId);
    }

    async findWithDetails(id: string): Promise<Weight | null> {
        return (this.repository as WeightRepository).findWithDetails(id);
    }

    async recordWeight(data: Partial<Weight>, username: string): Promise<Weight> {
        const previous = await (this.repository as WeightRepository).findPreviousBeforeDate(
            data.sheepId!,
            data.measurementDate!
        );
        const dailyGain = calculateDailyGain(
            data.weight!,
            data.measurementDate!,
            previous
        );
        const record = await this.create({ ...data, dailyGain }, username);

        const latest = await this.findLatestBySheep(data.sheepId!);
        if (latest?.id === record.id) {
            await (new SheepRepository()).update(data.sheepId!, {
                weight: data.weight!,
                updatedBy: username,
            });
        }

        return record;
    }

    async getWeightHistory(sheepId: string): Promise<Weight[]> {
        return this.find({
            where: { sheepId },
            order: { measurementDate: 'DESC' },
        });
    }

    async findLatestMapBySheepIds(sheepIds: string[]): Promise<Map<string, Weight>> {
        return (this.repository as WeightRepository).findLatestMapBySheepIds(sheepIds);
    }

    async attachLatestWeights<T extends { id: string }>(
        items: T[]
    ): Promise<SheepWithLatestWeight<T>[]> {
        if (items.length === 0) return [];
        const latestBySheep = await this.findLatestMapBySheepIds(items.map(item => item.id));
        return items.map(item => {
            const latest = latestBySheep.get(item.id);
            return {
                ...item,
                latestWeight: latest ? Number(latest.weight) : null,
                latestWeightDate: latest?.measurementDate ?? null,
            };
        });
    }
}
