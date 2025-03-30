import { BaseService } from './base.service';
import { SheepRepository } from '../repositories/sheep.repository';
import { Sheep } from '../entities/sheep.entity';
import { Gender, SheepStatus } from '@awsp__/utils';

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

    async findBreedingAnimals(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findBreedingAnimals();
    }

    async findMalton(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findMalton();
    }

    async findBreastfeeding(): Promise<Sheep[]> {
        return (this.repository as SheepRepository).findBreastfeeding();
    }

    async findWithParents(id: string): Promise<Sheep | null> {
        return (this.repository as SheepRepository).findWithParents(id);
    }

    async updateStatus(id: string, status: SheepStatus, username: string): Promise<Sheep | null> {
        return this.update(id, { status }, username);
    }

    async updateBreedingStatus(id: string, isBreedingAnimal: boolean, username: string): Promise<Sheep | null> {
        return this.update(id, { isBreedingAnimal }, username);
    }

    async updateMaltonStatus(id: string, isMalton: boolean, username: string): Promise<Sheep | null> {
        return this.update(id, { isMalton }, username);
    }

    async updateBreastfeedingStatus(id: string, isBreastfeeding: boolean, username: string): Promise<Sheep | null> {
        return this.update(id, { isBreastfeeding }, username);
    }
} 