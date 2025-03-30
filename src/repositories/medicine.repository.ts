import { BaseRepository } from './base.repository';
import { Medicine } from '../entities/medicine.entity';
import { MedicineType } from '@awsp__/utils';

export class MedicineRepository extends BaseRepository<Medicine> {
    constructor() {
        super(Medicine);
    }

    async findByType(type: MedicineType): Promise<Medicine[]> {
        return this.repository.find({ where: { type } as any });
    }

    async findWithApplications(id: string): Promise<Medicine | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['applications']
        });
    }
} 