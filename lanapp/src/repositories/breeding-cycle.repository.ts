import { BaseRepository } from './base.repository';
import { BreedingCycle } from '../entities/breeding-cycle.entity';

export class BreedingCycleRepository extends BaseRepository<BreedingCycle> {
    constructor() {
        super(BreedingCycle);
    }

    async findByEwe(eweId: string): Promise<BreedingCycle[]> {
        return this.repository.find({
            where: { eweId },
            order: { matingDate: 'DESC' },
            relations: ['ewe', 'ram'],
        });
    }

    async findByCycleName(cycleName: string): Promise<BreedingCycle[]> {
        return this.repository.find({
            where: { cycleName },
            order: { matingDate: 'ASC' },
            relations: ['ewe', 'ram'],
        });
    }

    async findByEweAndCycle(eweId: string, cycleName: string): Promise<BreedingCycle | null> {
        return this.repository.findOne({
            where: { eweId, cycleName },
        });
    }
}
