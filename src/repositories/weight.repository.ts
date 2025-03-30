import { BaseRepository } from './base.repository';
import { Weight } from '../entities/weight.entity';

export class WeightRepository extends BaseRepository<Weight> {
    constructor() {
        super(Weight);
    }

    async findBySheep(sheepId: string): Promise<Weight[]> {
        return this.repository.find({ 
            where: { sheepId } as any,
            order: { measurementDate: 'DESC' } as any
        });
    }

    async findLatestBySheep(sheepId: string): Promise<Weight | null> {
        return this.repository.findOne({
            where: { sheepId } as any,
            order: { measurementDate: 'DESC' } as any
        });
    }

    async findWithDetails(id: string): Promise<Weight | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['sheep']
        });
    }
} 