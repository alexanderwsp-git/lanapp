import { Gender, SheepStatus, RecordType, SheepCategory } from '@sheep/domain';
import { BaseService } from './base.service';
import { SheepRepository } from '../repositories/sheep.repository';
import { WeaningRecordRepository } from '../repositories/weaning-record.repository';
import { WeightService } from './weight.service';
import { Sheep } from '../entities/sheep.entity';

import { determineCategory, isInQuarantine } from '../utils/utils';

export class SheepService extends BaseService<Sheep> {
    private weaningRecordRepository: WeaningRecordRepository;
    private weightService: WeightService;

    constructor() {
        super(new SheepRepository());
        this.weaningRecordRepository = new WeaningRecordRepository();
        this.weightService = new WeightService();
    }

    private async buildCategoryContext(
        sheep: Pick<Sheep, 'id' | 'gender' | 'birthDate' | 'isPregnant' | 'deliveryDate'>
    ): Promise<CategoryContext> {
        const records = await this.weaningRecordRepository.findBySheep(sheep.id);
        return {
            isPregnant: sheep.isPregnant,
            isLactating: !!sheep.deliveryDate && !sheep.isPregnant,
            isWeaned: records.length > 0,
        };
    }

    async findByGender(gender: Gender): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findByGender(gender);
    }

    async findByStatus(status: SheepStatus): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findByStatus(status);
    }

    async findByRecordType(recordType: RecordType): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findByRecordType(recordType);
    }

    async findInQuarantine(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findInQuarantine();
    }

    async findFiltered(filters: {
        gender?: Gender;
        status?: SheepStatus;
        category?: SheepCategory;
        locationId?: string;
    }): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findFiltered(filters);
    }

    async findByIds(ids: string[]): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findByIds(ids);
    }

    async findPregnant(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findPregnant();
    }

    async findMaltonas(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findMaltonas();
    }

    async findWithParents(id: string): Promise<Sheep | null> {
        return (this.repository as SheepRepository).findWithParents(id);
    }

    async updateStatus(id: string, status: SheepStatus, username: string): Promise<Sheep | null> {
        return this.update(id, { status }, username);
    }

    async create(
        data: Partial<Sheep> & { currentLocationId?: string },
        username: string
    ): Promise<Sheep> {
        const { currentLocationId, ...rest } = data;
        const category = determineCategory(rest.gender!, rest.birthDate!, {
            isPregnant: rest.isPregnant || false,
            isLactating: !!rest.deliveryDate && !rest.isPregnant,
        });

        const status =
            rest.recordType === RecordType.BORN ? SheepStatus.QUARANTINE : SheepStatus.ACTIVE;

        const sheep = await this.repository.create({
            ...rest,
            ...(currentLocationId ? { currentLocation: { id: currentLocationId } as any } : {}),
            category,
            status,
            createdBy: username,
            updatedBy: username,
        });

        await this.weightService.recordWeight(
            {
                sheepId: sheep.id,
                weight: rest.weight!,
                measurementDate: rest.birthDate!,
                notes: 'Peso al registro',
            },
            username
        );

        return sheep;
    }

    async update(
        id: string,
        data: Partial<Sheep> & { currentLocationId?: string },
        username: string
    ): Promise<Sheep | null> {
        const { currentLocationId, weight: _weight, ...rest } = data;
        const updateData = {
            ...rest,
            ...(currentLocationId !== undefined
                ? { currentLocation: currentLocationId ? ({ id: currentLocationId } as any) : null }
                : {}),
        };

        const sheep = await super.update(id, updateData, username);
        if (!sheep) return null;

        const category = determineCategory(sheep.gender, sheep.birthDate, {
            isPregnant: sheep.isPregnant,
            isLactating: !!sheep.deliveryDate && !sheep.isPregnant,
        });

        if (sheep.status === SheepStatus.QUARANTINE && !isInQuarantine(sheep.birthDate)) {
            return super.update(
                id,
                {
                    status: SheepStatus.ACTIVE,
                    category,
                },
                username
            );
        }

        return super.update(id, { category }, username);
    }

    async checkQuarantineStatus(): Promise<void> {
        const sheepInQuarantine = await this.findInQuarantine();
        for (const sheep of sheepInQuarantine) {
            if (!isInQuarantine(sheep.birthDate)) {
                const category = determineCategory(sheep.gender, sheep.birthDate, {
                    isPregnant: sheep.isPregnant,
                    isLactating: !!sheep.deliveryDate && !sheep.isPregnant,
                });
                await this.update(
                    sheep.id,
                    {
                        status: SheepStatus.ACTIVE,
                        category,
                    },
                    'system'
                );
            }
        }
    }
}
