import { BaseRepository } from './base.repository';
import { MedicineApplication } from '../entities/medicine-application.entity';
import { MedicineStatus } from '@alexanderwsp-git/awsp-utils';

export class MedicineApplicationRepository extends BaseRepository<MedicineApplication> {
    constructor() {
        super(MedicineApplication);
    }

    async findByStatus(status: MedicineStatus): Promise<MedicineApplication[]> {
        return this.repository.find({ where: { status } as any });
    }

    async findBySheep(sheepId: string): Promise<MedicineApplication[]> {
        return this.repository.find({
            where: { sheepId } as any,
            relations: ['medicine'],
        });
    }

    async findByMedicine(medicineId: string): Promise<MedicineApplication[]> {
        return this.repository.find({ where: { medicineId } as any });
    }

    async findScheduled(): Promise<MedicineApplication[]> {
        return this.repository.find({ where: { status: MedicineStatus.SCHEDULED } as any });
    }

    async findPending(): Promise<MedicineApplication[]> {
        return this.repository.find({
            where: {
                nextApplicationDate: { $lte: new Date() },
            } as any,
            relations: ['medicine', 'sheep'],
        });
    }

    async findWithDetails(id: string): Promise<MedicineApplication | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['medicine', 'sheep'],
        });
    }
}
