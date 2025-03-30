import { BaseService } from './base.service';
import { PregnancyCheckRepository } from '../repositories/pregnancy-check.repository';
import { PregnancyCheck } from '../entities/pregnancy-check.entity';
import { MatingService } from './mating.service';
import { SheepService } from './sheep.service';

export class PregnancyCheckService extends BaseService<PregnancyCheck> {
    private matingService: MatingService;
    private sheepService: SheepService;

    constructor() {
        super(new PregnancyCheckRepository());
        this.matingService = new MatingService();
        this.sheepService = new SheepService();
    }

    async findByMating(matingId: string): Promise<PregnancyCheck[]> {
        return (this.repository as PregnancyCheckRepository).findByMating(matingId);
    }

    async findLatestByMating(matingId: string): Promise<PregnancyCheck | null> {
        return (this.repository as PregnancyCheckRepository).findLatestByMating(matingId);
    }

    async recordCheck(
        data: {
            matingId: string;
            checkDate: Date;
            isPregnant: boolean;
            notes?: string;
            nextCheckDate?: Date;
        },
        username: string
    ): Promise<PregnancyCheck> {
        // Get the mating record
        const mating = await this.matingService.findOne(data.matingId);
        if (!mating) throw new Error('Mating not found');

        // Create the pregnancy check record
        const check = await this.create(data, username);

        // If pregnancy is confirmed, update the mating and sheep status
        if (data.isPregnant) {
            // Update mating status
            await this.matingService.markAsEffective(data.matingId, username);

            // Update female's pregnancy status
            await this.sheepService.update(
                mating.femaleId,
                {
                    isPregnant: true,
                    pregnancyConfirmedAt: data.checkDate,
                    lastMountedDate: data.checkDate,
                },
                username
            );
        }

        return check;
    }

    async recordDelivery(
        matingId: string,
        data: {
            deliveryDate: Date;
            notes?: string;
        },
        username: string
    ): Promise<PregnancyCheck> {
        // Get the mating record
        const mating = await this.matingService.findOne(matingId);
        if (!mating) throw new Error('Mating not found');

        // Create a final pregnancy check record
        const check = await this.create(
            {
                matingId,
                checkDate: data.deliveryDate,
                isPregnant: false,
                notes: data.notes,
            },
            username
        );

        // Update female's pregnancy status
        await this.sheepService.update(
            mating.femaleId,
            {
                isPregnant: false,
                deliveryDate: data.deliveryDate,
                lastMountedDate: data.deliveryDate,
            },
            username
        );

        return check;
    }

    async getCheckHistory(matingId: string): Promise<PregnancyCheck[]> {
        return this.findByMating(matingId);
    }

    async getLatestCheck(matingId: string): Promise<PregnancyCheck | null> {
        return this.findLatestByMating(matingId);
    }
}
