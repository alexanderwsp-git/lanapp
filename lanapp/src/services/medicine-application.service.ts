import { MedicineStatus, BulkMedicineSchedule } from '@sheep/domain';
import { BaseService } from './base.service';
import { MedicineApplicationRepository } from '../repositories/medicine-application.repository';
import { MedicineApplication } from '../entities/medicine-application.entity';
import { SheepRepository } from '../repositories/sheep.repository';
import { BulkResult, emptyBulkResult, resolveSheepIds } from '../utils/bulk-target';

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

    async bulkSchedule(
        data: BulkMedicineSchedule,
        username: string
    ): Promise<BulkResult> {
        const sheepRepository = new SheepRepository();
        const sheepIds = await resolveSheepIds(sheepRepository, data);
        const result = emptyBulkResult();
        result.total = sheepIds.length;

        if (sheepIds.length === 0) return result;

        const sheepById = new Map(
            (await sheepRepository.findByIds(sheepIds)).map(s => [s.id, s])
        );

        for (const sheepId of sheepIds) {
            if (!sheepById.has(sheepId)) {
                result.failed.push({ sheepId, error: 'Oveja no encontrada' });
                continue;
            }
            try {
                const application = await this.scheduleApplication(
                    {
                        medicineId: data.medicineId,
                        sheepId,
                        applicationDate: data.applicationDate,
                        notes: data.notes,
                    },
                    username
                );
                result.succeeded.push({ sheepId, recordId: application.id });
            } catch (err) {
                result.failed.push({
                    sheepId,
                    error: err instanceof Error ? err.message : 'No se pudo programar',
                });
            }
        }

        return result;
    }
}
