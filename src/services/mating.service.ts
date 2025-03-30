import { BaseService } from './base.service';
import { MatingRepository } from '../repositories/mating.repository';
import { Mating } from '../entities/mating.entity';
import { SheepService } from './sheep.service';
import { MatingStatus } from '@awsp__/utils';

export class MatingService extends BaseService<Mating> {
    private sheepService: SheepService;

    constructor() {
        super(new MatingRepository());
        this.sheepService = new SheepService();
    }

    async recordMating(
        data: {
            maleId: string;
            femaleId: string;
            matingDate: Date;
            expectedBirthDate?: Date;
        },
        username: string
    ): Promise<Mating> {
        const mating = await this.create(
            {
                ...data,
                status: MatingStatus.PENDING,
            },
            username
        );

        // Update female's last mounted date
        await this.sheepService.update(
            data.femaleId,
            { lastMountedDate: data.matingDate },
            username
        );

        return mating;
    }

    async markAsEffective(id: string, username: string): Promise<Mating> {
        const mating = await this.findOne(id);
        if (!mating) throw new Error('Mating not found');

        const updates: Partial<Mating> = {
            status: MatingStatus.EFFECTIVE,
        };

        const updated = await this.update(id, updates, username);
        if (!updated) throw new Error('Failed to update mating');
        return updated;
    }

    async markAsIneffective(id: string, username: string): Promise<Mating> {
        const mating = await this.findOne(id);
        if (!mating) throw new Error('Mating not found');

        const updates: Partial<Mating> = {
            status: MatingStatus.INEFFECTIVE,
        };

        const updated = await this.update(id, updates, username);
        if (!updated) throw new Error('Failed to update mating');
        return updated;
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

    async findBySheep(sheepId: string): Promise<Mating[]> {
        return (this.repository as MatingRepository).findBySheep(sheepId);
    }

    async findWithDetails(id: string): Promise<Mating | null> {
        return (this.repository as MatingRepository).findWithDetails(id);
    }
}
