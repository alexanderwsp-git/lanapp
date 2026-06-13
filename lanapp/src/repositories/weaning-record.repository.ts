import { In } from 'typeorm';
import { BaseRepository } from './base.repository';
import { WeaningRecord } from '../entities/weaning-record.entity';

export class WeaningRecordRepository extends BaseRepository<WeaningRecord> {
    constructor() {
        super(WeaningRecord);
    }

    async findBySheep(sheepId: string): Promise<WeaningRecord[]> {
        return this.repository.find({
            where: { sheepId },
            order: { weaningDate: 'DESC' },
        });
    }

    async findSheepIdsWithRecords(sheepIds: string[]): Promise<Set<string>> {
        if (sheepIds.length === 0) return new Set();
        const records = await this.repository.find({
            where: { sheepId: In(sheepIds) },
            select: ['sheepId'],
        });
        return new Set(records.map(r => r.sheepId));
    }
}
