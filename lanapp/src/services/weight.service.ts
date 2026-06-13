import { BaseService } from './base.service';
import { WeightRepository } from '../repositories/weight.repository';
import { Weight } from '../entities/weight.entity';
import { calculateDailyGain } from '../utils/weight.utils';

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
        const previous = await this.findLatestBySheep(data.sheepId!);
        const dailyGain = calculateDailyGain(
            data.weight!,
            data.measurementDate!,
            previous
        );
        return this.create({ ...data, dailyGain }, username);
    }

    async getWeightHistory(sheepId: string): Promise<Weight[]> {
        return this.find({
            where: { sheepId },
            order: { measurementDate: 'DESC' },
        });
    }
}
