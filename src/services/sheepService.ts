import { SheepRepository } from '../repositories/sheepRepository';
import { Sheep } from '../entities/sheep';

export class SheepService {
    private sheepRepository = new SheepRepository();

    async createSheep(data: Partial<Sheep>): Promise<Sheep> {
        return this.sheepRepository.create(data);
    }

    async getAllSheep(): Promise<Sheep[]> {
        return this.sheepRepository.findAll();
    }

    async getSheepById(id: string): Promise<Sheep | null> {
        return this.sheepRepository.findById(id);
    }

    async updateSheep(
        id: string,
        data: Partial<Sheep>
    ): Promise<Sheep | null> {
        return this.sheepRepository.update(id, data);
    }

    async deleteSheep(id: string): Promise<boolean> {
        return this.sheepRepository.delete(id);
    }

    async getPaginatedSheep(
        page: number = 1,
        limit: number = 10,
        filters: any
    ) {
        return this.sheepRepository.getPaginatedSheep(page, limit, filters);
    }

    async updateSheepWeight(id: string, weight: number): Promise<Sheep | null> {
        return this.sheepRepository.updateWeight(id, weight);
    }

    async updateSheepMountingDate(
        id: string,
        date: Date
    ): Promise<Sheep | null> {
        return this.sheepRepository.updateMountingDate(id, date);
    }
} 