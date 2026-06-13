import { Repository, FindOptionsWhere, FindOptionsOrder, DeepPartial, ILike } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { AppDataSource } from '../config/ormconfig';

export abstract class BaseRepository<T extends BaseEntity> {
    protected repository: Repository<T>;

    constructor(entityClass: new () => T) {
        this.repository = AppDataSource.getRepository(entityClass);
    }

    async findOne(id: string): Promise<T | null> {
        return this.repository.findOne({ where: { id } as any });
    }

    async find(options?: {
        where?: FindOptionsWhere<T>;
        order?: FindOptionsOrder<T>;
        skip?: number;
        take?: number;
    }): Promise<T[]> {
        return this.repository.find(options);
    }

    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: T[]; total: number }> {
        const [data, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' } as any,
        });
        return { data, total };
    }

    async update(id: string, data: DeepPartial<T>): Promise<T | null> {
        const entity = await this.findOne(id);
        if (!entity) return null;

        Object.assign(entity, data);
        return this.repository.save(entity);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }

    async getPaginated(page: number = 1, limit: number = 10, filters: any) {
        const where: any = {};

        if (filters.name) where.name = ILike(`%${filters.name}%`);
        if (filters.status) where.status = filters.status;

        const [settings, total] = await this.repository.findAndCount({
            where,
            take: limit,
            skip: (page - 1) * limit,
            order: { createdAt: 'DESC' } as FindOptionsOrder<T>,
        });

        return {
            data: settings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
