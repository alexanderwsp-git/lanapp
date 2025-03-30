import { BaseService } from './base.service';
import { SheepRepository } from '../repositories/sheep.repository';
import { Sheep } from '../entities/sheep.entity';
import { Gender, SheepStatus, RecordType } from '@awsp__/utils';
import { determineCategory, calculateQuarantineEndDate, isInQuarantine } from '../utils/utils';

export class SheepService extends BaseService<Sheep> {
    constructor() {
        super(new SheepRepository());
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

    async findWithParents(id: string): Promise<Sheep | null> {
        return (this.repository as SheepRepository).findWithParents(id);
    }

    async updateStatus(id: string, status: SheepStatus, username: string): Promise<Sheep | null> {
        return this.update(id, { status }, username);
    }

    async create(data: Partial<Sheep>, username: string): Promise<Sheep> {
        const sheep = await super.create(data, username);
        
        // If the sheep was born on the farm, set quarantine
        if (sheep.recordType === RecordType.BORN) {
            const quarantineEndDate = calculateQuarantineEndDate(sheep.birthDate);
            await this.update(sheep.id, {
                status: SheepStatus.QUARANTINE,
                quarantineEndDate
            }, username);
        }

        return sheep;
    }

    async update(id: string, data: Partial<Sheep>, username: string): Promise<Sheep | null> {
        const sheep = await super.update(id, data, username);
        if (!sheep) return null;

        // Update category based on current state
        const category = determineCategory(
            sheep.gender,
            sheep.birthDate,
            sheep.isPregnant,
            !!sheep.deliveryDate
        );
        
        // Check if quarantine should be lifted
        if (sheep.status === SheepStatus.QUARANTINE && !isInQuarantine(sheep.birthDate)) {
            await super.update(id, {
                status: SheepStatus.ACTIVE,
                category
            }, username);
        } else {
            await super.update(id, { category }, username);
        }

        return sheep;
    }

    async checkQuarantineStatus(): Promise<void> {
        const sheepInQuarantine = await this.findInQuarantine();
        for (const sheep of sheepInQuarantine) {
            if (!isInQuarantine(sheep.birthDate)) {
                const category = determineCategory(
                    sheep.gender,
                    sheep.birthDate,
                    sheep.isPregnant,
                    !!sheep.deliveryDate
                );
                await this.update(sheep.id, {
                    status: SheepStatus.ACTIVE,
                    category
                }, 'system');
            }
        }
    }
} 