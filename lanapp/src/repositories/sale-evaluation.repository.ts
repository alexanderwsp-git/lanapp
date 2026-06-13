import { BaseRepository } from './base.repository';
import { SaleEvaluation } from '../entities/sale-evaluation.entity';

export class SaleEvaluationRepository extends BaseRepository<SaleEvaluation> {
    constructor() {
        super(SaleEvaluation);
    }

    async findBySheep(sheepId: string): Promise<SaleEvaluation[]> {
        return this.repository.find({
            where: { sheepId },
            order: { evaluatedAt: 'DESC' },
        });
    }

    async findByBatch(batchPeriod: string): Promise<SaleEvaluation[]> {
        return this.repository.find({
            where: { batchPeriod },
            relations: ['sheep'],
        });
    }
}
