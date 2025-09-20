import { BaseRepository } from './base.repository';
import { Mating } from '../entities/mating.entity';
import { MatingStatus } from '@alexanderwsp-git/awsp-utils';

export class MatingRepository extends BaseRepository<Mating> {
    constructor() {
        super(Mating);
    }

    async findByStatus(status: MatingStatus): Promise<Mating[]> {
        return this.repository.find({ where: { status } as any });
    }

    async findByMale(maleId: string): Promise<Mating[]> {
        return this.repository.find({ where: { maleId } as any });
    }

    async findByFemale(femaleId: string): Promise<Mating[]> {
        return this.repository.find({ where: { femaleId } as any });
    }

    async findBySheep(sheepId: string): Promise<Mating[]> {
        return this.repository.find({
            where: [{ maleId: sheepId } as any, { femaleId: sheepId } as any],
        });
    }

    async findWithDetails(id: string): Promise<Mating | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['male', 'female'],
        });
    }
}
