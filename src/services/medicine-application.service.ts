import { BaseService } from './base.service';
import { MedicineApplicationRepository } from '../repositories/medicine-application.repository';
import { MedicineApplication } from '../entities/medicine-application.entity';
import { MedicineStatus } from '@awsp__/utils';

export class MedicineApplicationService extends BaseService<MedicineApplication> {
    constructor() {
        super(new MedicineApplicationRepository());
    }

    async findByStatus(status: MedicineStatus): Promise<MedicineApplication[]> {
        return (this.repository as MedicineApplicationRepository).findByStatus(status);
    }

    async findBySheep(sheepId: string): Promise<MedicineApplication[]> {
        return (this.repository as MedicineApplicationRepository).findBySheep(sheepId);
    }

    async findByMedicine(medicineId: string): Promise<MedicineApplication[]> {
        return (this.repository as MedicineApplicationRepository).findByMedicine(medicineId);
    }

    async findScheduled(): Promise<MedicineApplication[]> {
        return (this.repository as MedicineApplicationRepository).findScheduled();
    }

    async findPending(): Promise<MedicineApplication[]> {
        return (this.repository as MedicineApplicationRepository).findPending();
    }

    async findWithDetails(id: string): Promise<MedicineApplication | null> {
        return (this.repository as MedicineApplicationRepository).findWithDetails(id);
    }

    async scheduleApplication(
        data: Partial<MedicineApplication>,
        username: string
    ): Promise<MedicineApplication> {
        return this.create(
            {
                ...data,
                status: MedicineStatus.SCHEDULED,
            },
            username
        );
    }

    async applyMedicine(id: string, username: string): Promise<MedicineApplication | null> {
        return this.update(
            id,
            {
                status: MedicineStatus.APPLIED,
            },
            username
        );
    }

    async cancelApplication(id: string, username: string): Promise<MedicineApplication | null> {
        return this.update(
            id,
            {
                status: MedicineStatus.CANCELLED,
            },
            username
        );
    }

    async markAsMissed(id: string, username: string): Promise<MedicineApplication | null> {
        return this.update(
            id,
            {
                status: MedicineStatus.MISSED,
            },
            username
        );
    }
}
