import { AppDataSource } from '../config/ormconfig';
import { Sheep } from '../entities/sheep';
import { ILike, Repository } from 'typeorm';

export class SheepRepository {
    private repository: Repository<Sheep>;

    constructor() {
        this.repository = AppDataSource.getRepository(Sheep);
    }

    async create(sheepData: Partial<Sheep>): Promise<Sheep> {
        const sheep = this.repository.create(sheepData);
        return this.repository.save(sheep);
    }

    async findAll(): Promise<Sheep[]> {
        return this.repository.find({
            relations: ['mother', 'father'],
        });
    }

    async findById(id: string): Promise<Sheep | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['mother', 'father'],
        });
    }

    async update(
        id: string,
        sheepData: Partial<Sheep>
    ): Promise<Sheep | null> {
        const sheep = await this.findById(id);
        if (!sheep) return null;

        Object.assign(sheep, sheepData);
        return this.repository.save(sheep);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }

    async getPaginatedSheep(page: number, limit: number, filters: any) {
        const where: any = {};

        if (filters.tag) where.tag = ILike(`%${filters.tag}%`);
        if (filters.name) where.name = ILike(`%${filters.name}%`);
        if (filters.breed) where.breed = ILike(`%${filters.breed}%`);
        if (filters.gender) where.gender = filters.gender;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;

        const [sheep, total] = await this.repository.findAndCount({
            where,
            relations: ['mother', 'father'],
            take: limit,
            skip: (page - 1) * limit,
            order: { createdAt: 'DESC' },
        });

        return {
            data: sheep,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateWeight(id: string, weight: number): Promise<Sheep | null> {
        const sheep = await this.findById(id);
        if (!sheep) return null;

        sheep.weight = weight;
        return this.repository.save(sheep);
    }

    async updateMountingDate(id: string, date: Date): Promise<Sheep | null> {
        const sheep = await this.findById(id);
        if (!sheep) return null;

        sheep.lastMountedDate = date;
        return this.repository.save(sheep);
    }
} 