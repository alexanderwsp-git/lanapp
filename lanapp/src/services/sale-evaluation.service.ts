import { BirthType } from '@sheep/domain';
import { BaseService } from './base.service';
import { SaleEvaluationRepository } from '../repositories/sale-evaluation.repository';
import { SaleEvaluation } from '../entities/sale-evaluation.entity';
import { SheepService } from './sheep.service';

import { Sheep } from '../entities/sheep.entity';

export class SaleEvaluationService extends BaseService<SaleEvaluation> {
    private sheepService: SheepService;

    constructor() {
        super(new SaleEvaluationRepository());
        this.sheepService = new SheepService();
    }

    async findBySheep(sheepId: string): Promise<SaleEvaluation[]> {
        return (this.repository as SaleEvaluationRepository).findBySheep(sheepId);
    }

    async evaluateBatch(batchPeriod: string, username: string): Promise<SaleEvaluation[]> {
        const { data: sheepList } = await this.sheepService.findAll(1, 10000);

        const lambs = (sheepList as Sheep[]).filter(s => {
                const ageDays =
                    (Date.now() - new Date(s.birthDate).getTime()) / (1000 * 60 * 60 * 24);
                return ageDays <= 180;
            }
        );

        const avgBirthWeight =
            lambs.reduce((sum, s) => sum + Number(s.weight), 0) / (lambs.length || 1);

        const evaluations: SaleEvaluation[] = [];

        for (const sheep of lambs) {
            let eligible = false;
            let reason = '';

            if (Number(sheep.weight) < avgBirthWeight) {
                eligible = true;
                reason = 'Below average birth weight';
            } else if (sheep.birthType === BirthType.SINGLE) {
                eligible = true;
                reason = 'Single birth - preferred for sale';
            } else if (sheep.birthType === BirthType.TWIN) {
                eligible = false;
                reason = 'Twin birth - preferred to keep';
            }

            const evaluation = await this.create(
                {
                    sheepId: sheep.id,
                    batchPeriod,
                    birthWeightAvg: avgBirthWeight,
                    eligible,
                    reason,
                    evaluatedAt: new Date(),
                },
                username
            );
            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
