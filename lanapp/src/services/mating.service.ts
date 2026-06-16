import { MatingStatus, BulkMatingSchedule } from '@sheep/domain';
import { BaseService } from './base.service';
import { MatingRepository } from '../repositories/mating.repository';
import { Mating } from '../entities/mating.entity';
import { SheepService } from './sheep.service';
import { BulkResult, emptyBulkResult } from '../utils/bulk-target';
import { eweBreedingEligibility, ramBreedingEligibility } from '../utils/breeding-eligibility';

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
            notes?: string;
        },
        username: string
    ): Promise<Mating> {
        const [male, female] = await Promise.all([
            this.sheepService.findOne(data.maleId),
            this.sheepService.findOne(data.femaleId),
        ]);
        if (!male) throw new Error('Carnero no encontrado');
        if (!female) throw new Error('Oveja no encontrada');
        const ramError = ramBreedingEligibility(male);
        if (ramError) throw new Error(ramError);
        const eweError = eweBreedingEligibility(female);
        if (eweError) throw new Error(eweError);

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

    async bulkRecordMating(data: BulkMatingSchedule, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const uniqueFemaleIds = [...new Set(data.femaleIds)];
        result.total = uniqueFemaleIds.length;

        const [male, females] = await Promise.all([
            this.sheepService.findOne(data.maleId),
            this.sheepService.findByIds(uniqueFemaleIds),
        ]);

        if (!male) {
            for (const femaleId of uniqueFemaleIds) {
                result.failed.push({ sheepId: femaleId, error: 'Carnero no encontrado' });
            }
            return result;
        }
        const ramError = ramBreedingEligibility(male);
        if (ramError) {
            for (const femaleId of uniqueFemaleIds) {
                result.failed.push({ sheepId: femaleId, error: ramError });
            }
            return result;
        }

        const femaleById = new Map(females.map(f => [f.id, f]));

        for (const femaleId of uniqueFemaleIds) {
            const female = femaleById.get(femaleId);
            if (!female) {
                result.failed.push({ sheepId: femaleId, error: 'Oveja no encontrada' });
                continue;
            }
            const eweError = eweBreedingEligibility(female);
            if (eweError) {
                result.failed.push({ sheepId: femaleId, error: eweError });
                continue;
            }
            try {
                const mating = await this.recordMating(
                    {
                        maleId: data.maleId,
                        femaleId,
                        matingDate: data.matingDate,
                        expectedBirthDate: data.expectedBirthDate,
                        notes: data.notes,
                    },
                    username
                );
                result.succeeded.push({ sheepId: femaleId, recordId: mating.id });
            } catch (err) {
                result.failed.push({
                    sheepId: femaleId,
                    error: err instanceof Error ? err.message : 'No se pudo registrar la monta',
                });
            }
        }

        return result;
    }
}
