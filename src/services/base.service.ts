import { BaseRepository } from '../repositories/base.repository';
import { BaseEntity } from '../entities/base.entity';
import { DeepPartial } from 'typeorm';

export abstract class BaseService<T extends BaseEntity> {
    constructor(protected readonly repository: BaseRepository<T>) {}

    async findOne(id: string): Promise<T | null> {
        return this.repository.findOne(id);
    }

    async find(options?: { where?: any; order?: any; skip?: number; take?: number }): Promise<T[]> {
        return this.repository.find(options);
    }

    async create(data: DeepPartial<T>, username: string): Promise<T> {
        return this.repository.create({
            ...data,
            createdBy: username,
            updatedBy: username,
        });
    }

    async update(id: string, data: DeepPartial<T>, username: string): Promise<T | null> {
        return this.repository.update(id, {
            ...data,
            updatedBy: username,
        });
    }

    async delete(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: T[]; total: number }> {
        return this.repository.findAll(page, limit);
    }
}
