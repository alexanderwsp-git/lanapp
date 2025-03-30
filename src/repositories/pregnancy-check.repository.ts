import { BaseRepository } from './base.repository';
import { PregnancyCheck } from '../entities/pregnancy-check.entity';

export class PregnancyCheckRepository extends BaseRepository<PregnancyCheck> {
    constructor() {
        super(PregnancyCheck);
    }

    async findByMating(matingId: string): Promise<PregnancyCheck[]> {
        return this.repository.find({
            where: { matingId } as any,
            order: { checkDate: 'DESC' },
        });
    }

    async findLatestByMating(matingId: string): Promise<PregnancyCheck | null> {
        return this.repository.findOne({
            where: { matingId } as any,
            order: { checkDate: 'DESC' },
        });
    }

    async findByFemale(femaleId: string): Promise<PregnancyCheck[]> {
        return this.repository
            .createQueryBuilder('check')
            .innerJoin('check.mating', 'mating')
            .where('mating.femaleId = :femaleId', { femaleId })
            .orderBy('check.checkDate', 'DESC')
            .getMany();
    }

    async findLatestByFemale(femaleId: string): Promise<PregnancyCheck | null> {
        return this.repository
            .createQueryBuilder('check')
            .innerJoin('check.mating', 'mating')
            .where('mating.femaleId = :femaleId', { femaleId })
            .orderBy('check.checkDate', 'DESC')
            .getOne();
    }
}
