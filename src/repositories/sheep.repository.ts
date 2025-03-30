import { BaseRepository } from './base.repository';
import { Sheep } from '../entities/sheep.entity';
import { Gender, SheepStatus, RecordType } from '@awsp__/utils';

export class SheepRepository extends BaseRepository<Sheep> {
    constructor() {
        super(Sheep);
    }

    async findByGender(gender: Gender): Promise<Sheep[]> {
        return this.repository.find({ where: { gender } as any });
    }

    async findByStatus(status: SheepStatus): Promise<Sheep[]> {
        return this.repository.find({ where: { status } as any });
    }

    async findByRecordType(recordType: RecordType): Promise<Sheep[]> {
        return this.repository.find({ where: { recordType } as any });
    }

    async findInQuarantine(): Promise<Sheep[]> {
        return this.repository.find({ 
            where: { 
                status: SheepStatus.QUARANTINE,
                quarantineEndDate: { $gt: new Date() } 
            } as any 
        });
    }

    async findBreedingAnimals(): Promise<Sheep[]> {
        return this.repository.find({ where: { isBreedingAnimal: true } as any });
    }

    async findMalton(): Promise<Sheep[]> {
        return this.repository.find({ where: { isMalton: true } as any });
    }

    async findBreastfeeding(): Promise<Sheep[]> {
        return this.repository.find({ where: { isBreastfeeding: true } as any });
    }

    async findWithParents(id: string): Promise<Sheep | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['mother', 'father']
        });
    }

    async findWithDetails(id: string): Promise<Sheep | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['mother', 'father', 'weights', 'medicineApplications', 'matingsAsMale', 'matingsAsFemale']
        });
    }

    async findActive(): Promise<Sheep[]> {
        return this.repository.find({ 
            where: { 
                status: SheepStatus.ACTIVE,
                quarantineEndDate: { $lt: new Date() } 
            } as any 
        });
    }
} 