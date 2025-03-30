import { BaseService } from './base.service';
import { MatingRepository } from '../repositories/mating.repository';
import { Mating } from '../entities/mating.entity';
import { MatingStatus } from '@awsp__/utils';

export class MatingService extends BaseService<Mating> {
    constructor() {
        super(new MatingRepository());
    }

    async findByStatus(status: MatingStatus): Promise<Mating[]> {
        return (this.repository as MatingRepository).findByStatus(status);
    }

    async findByMale(maleId: string): Promise<Mating[]> {
        return (this.repository as MatingRepository).findByMale(maleId);
    }

    async findByFemale(femaleId: string): Promise<Mating[]> {
        return (this.repository as MatingRepository).findByFemale(femaleId);
    }

    async findWithDetails(id: string): Promise<Mating | null> {
        return (this.repository as MatingRepository).findWithDetails(id);
    }

    async recordMating(data: Partial<Mating>, username: string): Promise<Mating> {
        return this.create({
            ...data,
            status: MatingStatus.PENDING,
            matingCount: 1,
            effectivenessCounter: 0
        }, username);
    }

    async markAsEffective(id: string, username: string): Promise<Mating | null> {
        const mating = await this.findOne(id);
        if (!mating) return null;

        return this.update(id, {
            status: MatingStatus.EFFECTIVE,
            effectivenessCounter: (mating.effectivenessCounter || 0) + 1
        }, username);
    }

    async markAsIneffective(id: string, username: string): Promise<Mating | null> {
        return this.update(id, {
            status: MatingStatus.INEFFECTIVE
        }, username);
    }

    async incrementMatingCount(id: string, username: string): Promise<Mating | null> {
        const mating = await this.findOne(id);
        if (!mating) return null;

        return this.update(id, {
            matingCount: (mating.matingCount || 1) + 1
        }, username);
    }
} 