import { BaseService } from './base.service';
import { HealthCheckRepository } from '../repositories/health-check.repository';
import { HealthCheck } from '../entities/health-check.entity';

export class HealthCheckService extends BaseService<HealthCheck> {
    constructor() {
        super(new HealthCheckRepository());
    }

    async findBySheep(sheepId: string): Promise<HealthCheck[]> {
        return (this.repository as HealthCheckRepository).findBySheep(sheepId);
    }

    async findHighScores(threshold = 3): Promise<HealthCheck[]> {
        return (this.repository as HealthCheckRepository).findHighScores(threshold);
    }

    async recordCheck(data: Partial<HealthCheck>, username: string): Promise<HealthCheck> {
        return this.create(
            {
                ...data,
                confirmedBy: data.confirmedBy || username,
            },
            username
        );
    }
}
