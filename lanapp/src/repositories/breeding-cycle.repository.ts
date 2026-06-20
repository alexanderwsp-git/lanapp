import { BreedingCycleStatus } from '@sheep/domain';
import { BaseRepository } from './base.repository';
import { BreedingCycle } from '../entities/breeding-cycle.entity';

export class BreedingCycleRepository extends BaseRepository<BreedingCycle> {
    constructor() {
        super(BreedingCycle);
    }

    override async findOne(id: string): Promise<BreedingCycle | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['ewe', 'ram', 'mating'],
        });
    }

    async findByEwe(eweId: string): Promise<BreedingCycle[]> {
        return this.repository.find({
            where: { eweId, status: BreedingCycleStatus.ACTIVE },
            order: { matingDate: 'DESC' },
            relations: ['ewe', 'ram', 'mating'],
        });
    }

    async findByCycleName(cycleName: string): Promise<BreedingCycle[]> {
        return this.repository.find({
            where: { cycleName, status: BreedingCycleStatus.ACTIVE },
            order: { matingDate: 'ASC' },
            relations: ['ewe', 'ram', 'mating'],
        });
    }

    /** Active cycle only — cancelled rows free the ewe for the same cycleName. */
    async findActiveByEweAndCycle(eweId: string, cycleName: string): Promise<BreedingCycle | null> {
        return this.repository.findOne({
            where: { eweId, cycleName, status: BreedingCycleStatus.ACTIVE },
        });
    }

    async findActiveByMatingId(matingId: string): Promise<BreedingCycle | null> {
        return this.repository.findOne({
            where: { matingId, status: BreedingCycleStatus.ACTIVE },
            relations: ['ewe', 'ram', 'mating'],
        });
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: BreedingCycle[]; total: number }> {
        const [data, total] = await this.repository.findAndCount({
            where: { status: BreedingCycleStatus.ACTIVE },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['ewe', 'ram', 'mating'],
        });
        return { data, total };
    }
}
