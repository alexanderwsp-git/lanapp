import { BaseService } from './base.service';
import { MedicineRepository } from '../repositories/medicine.repository';
import { Medicine } from '../entities/medicine.entity';
import { MedicineType } from '@awsp__/utils';

export class MedicineService extends BaseService<Medicine> {
    constructor() {
        super(new MedicineRepository());
    }

    async findByType(type: MedicineType): Promise<Medicine[]> {
        return (this.repository as MedicineRepository).findByType(type);
    }

    async findWithApplications(id: string): Promise<Medicine | null> {
        return (this.repository as MedicineRepository).findWithApplications(id);
    }
} 