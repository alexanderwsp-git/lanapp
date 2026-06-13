import { BaseRepository } from './base.repository';
import { HealthCheck } from '../entities/health-check.entity';

export class HealthCheckRepository extends BaseRepository<HealthCheck> {
    constructor() {
        super(HealthCheck);
    }

    async findBySheep(sheepId: string): Promise<HealthCheck[]> {
        return this.repository.find({
            where: { sheepId },
            order: { checkDate: 'DESC' },
        });
    }

    async findHighScores(threshold = 3): Promise<HealthCheck[]> {
        return this.repository
            .createQueryBuilder('hc')
            .where('hc.famachaScore >= :threshold', { threshold })
            .orderBy('hc.checkDate', 'DESC')
            .getMany();
    }

    async findLatestBySheep(sheepId: string): Promise<HealthCheck | null> {
        return this.repository.findOne({
            where: { sheepId },
            order: { checkDate: 'DESC' },
        });
    }
}
