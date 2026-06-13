import { In, LessThan } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Weight } from '../entities/weight.entity';

export class WeightRepository extends BaseRepository<Weight> {
    constructor() {
        super(Weight);
    }

    async findBySheep(sheepId: string): Promise<Weight[]> {
        return this.repository.find({
            where: { sheepId } as any,
            order: { measurementDate: 'DESC' } as any,
        });
    }

    async findLatestBySheep(sheepId: string): Promise<Weight | null> {
        return this.repository.findOne({
            where: { sheepId } as any,
            order: { measurementDate: 'DESC' } as any,
        });
    }

    /** Most recent pesaje strictly before the given date (for ganancia prom.). */
    async findPreviousBeforeDate(sheepId: string, beforeDate: Date): Promise<Weight | null> {
        return this.repository.findOne({
            where: { sheepId, measurementDate: LessThan(beforeDate) } as any,
            order: { measurementDate: 'DESC' } as any,
        });
    }

    async findWithDetails(id: string): Promise<Weight | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['sheep'],
        });
    }

    async findLatestMapBySheepIds(sheepIds: string[]): Promise<Map<string, Weight>> {
        if (sheepIds.length === 0) return new Map();
        const records = await this.repository.find({
            where: { sheepId: In(sheepIds) } as any,
            order: { measurementDate: 'DESC' } as any,
        });
        const map = new Map<string, Weight>();
        for (const record of records) {
            if (!map.has(record.sheepId)) {
                map.set(record.sheepId, record);
            }
        }
        return map;
    }
}
