import { Gender, SheepStatus, RecordType, SheepCategory } from '@sheep/domain';
import { In, LessThan, MoreThan } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Sheep } from '../entities/sheep.entity';

export class SheepRepository extends BaseRepository<Sheep> {
    constructor() {
        super(Sheep);
    }

    async findByGender(gender: Gender): Promise<Sheep[]> {
        return this.repository.find({ where: { gender } });
    }

    async findByStatus(status: SheepStatus): Promise<Sheep[]> {
        return this.repository.find({ where: { status } });
    }

    async findByCategory(category: SheepCategory): Promise<Sheep[]> {
        return this.repository.find({ where: { category } });
    }

    async findByRecordType(recordType: RecordType): Promise<Sheep[]> {
        return this.repository.find({ where: { recordType } });
    }

    async findByLocation(locationId: string): Promise<Sheep[]> {
        return this.repository
            .createQueryBuilder('sheep')
            .leftJoin('sheep.currentLocation', 'currentLocation')
            .leftJoin('sheep.birthLocation', 'birthLocation')
            .where('currentLocation.id = :locationId OR birthLocation.id = :locationId', {
                locationId,
            })
            .getMany();
    }

    async findFiltered(filters: {
        gender?: Gender;
        status?: SheepStatus;
        category?: SheepCategory;
        locationId?: string;
    }): Promise<Sheep[]> {
        if (filters.locationId) {
            const qb = this.repository
                .createQueryBuilder('sheep')
                .leftJoin('sheep.currentLocation', 'currentLocation')
                .leftJoin('sheep.birthLocation', 'birthLocation')
                .where(
                    'currentLocation.id = :locationId OR birthLocation.id = :locationId',
                    { locationId: filters.locationId }
                );
            if (filters.gender) {
                qb.andWhere('sheep.gender = :gender', { gender: filters.gender });
            }
            if (filters.status) {
                qb.andWhere('sheep.status = :status', { status: filters.status });
            }
            if (filters.category) {
                qb.andWhere('sheep.category = :category', { category: filters.category });
            }
            return qb.orderBy('sheep.tag', 'ASC').getMany();
        }

        const where: Record<string, unknown> = {};
        if (filters.gender) where.gender = filters.gender;
        if (filters.status) where.status = filters.status;
        if (filters.category) where.category = filters.category;
        return this.repository.find({ where, order: { tag: 'ASC' } });
    }

    async findByIds(ids: string[]): Promise<Sheep[]> {
        if (ids.length === 0) return [];
        return this.repository.find({
            where: { id: In(ids) },
            order: { tag: 'ASC' },
        });
    }

    async findInQuarantine(): Promise<Sheep[]> {
        return this.repository.find({
            where: {
                status: SheepStatus.QUARANTINE,
                quarantineEndDate: MoreThan(new Date()),
            },
        });
    }

    async findPregnant(): Promise<Sheep[]> {
        return this.repository.find({
            where: { isPregnant: true },
            order: { tag: 'ASC' },
        });
    }

    async findMaltonas(): Promise<Sheep[]> {
        return this.repository.find({
            where: [
                { category: SheepCategory.CORDERA_DESTETADA },
                { category: SheepCategory.BORREGA },
            ],
            order: { weight: 'DESC' },
        });
    }

    async findWithParents(id: string): Promise<Sheep | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['mother', 'father'],
        });
    }

    async findChildren(id: string): Promise<Sheep[]> {
        return this.repository
            .createQueryBuilder('sheep')
            .where('sheep.motherId = :id OR sheep.fatherId = :id', { id })
            .orderBy('sheep.birthDate', 'DESC')
            .getMany();
    }

    async findWithDetails(id: string): Promise<Sheep | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['mother', 'father', 'medicineApplications'],
        });
    }

    async findActive(): Promise<Sheep[]> {
        return this.repository.find({
            where: {
                status: SheepStatus.ACTIVE,
                quarantineEndDate: LessThan(new Date()),
            },
        });
    }
}
