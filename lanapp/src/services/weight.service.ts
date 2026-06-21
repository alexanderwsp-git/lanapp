import { BulkWeightSchedule } from '@sheep/domain';
import { BaseService } from './base.service';
import { WeightRepository } from '../repositories/weight.repository';
import { SheepRepository } from '../repositories/sheep.repository';
import { Weight } from '../entities/weight.entity';
import { calculateDailyGain, toDateKey } from '../utils/weight.utils';
import { BulkResult, emptyBulkResult, resolveSheepIds } from '../utils/bulk-target';

export type SheepWithLatestWeight<T> = T & {
    latestWeight: number | null;
    latestWeightDate: Date | null;
};

export class WeightService extends BaseService<Weight> {
    constructor() {
        super(new WeightRepository());
    }

    async findBySheep(sheepId: string): Promise<Weight[]> {
        return (this.repository as WeightRepository).findBySheep(sheepId);
    }

    async findLatestBySheep(sheepId: string): Promise<Weight | null> {
        return (this.repository as WeightRepository).findLatestBySheep(sheepId);
    }

    async findWithDetails(id: string): Promise<Weight | null> {
        return (this.repository as WeightRepository).findWithDetails(id);
    }

    /** Create a pesaje, or replace the row on the same calendar day (e.g. destete on birth date). */
    async upsertWeightOnDate(
        data: {
            sheepId: string;
            weight: number;
            measurementDate: Date;
            notes?: string;
        },
        username: string
    ): Promise<Weight> {
        const dateKey = toDateKey(data.measurementDate);
        const existing = await this.findBySheep(data.sheepId);
        const onDate = existing.find(w => toDateKey(w.measurementDate) === dateKey);

        if (onDate) {
            const previous = await (this.repository as WeightRepository).findPreviousBeforeDate(
                data.sheepId,
                data.measurementDate
            );
            const dailyGain = calculateDailyGain(
                data.weight,
                data.measurementDate,
                previous
            );
            const updated = await this.update(
                onDate.id,
                { weight: data.weight, notes: data.notes, dailyGain },
                username
            );
            const latest = await this.findLatestBySheep(data.sheepId);
            if (latest?.id === onDate.id) {
                await new SheepRepository().update(data.sheepId, {
                    weight: data.weight,
                    updatedBy: username,
                });
            }
            return updated!;
        }

        return this.recordWeight(data, username);
    }

    async recordWeight(data: Partial<Weight>, username: string): Promise<Weight> {
        const previous = await (this.repository as WeightRepository).findPreviousBeforeDate(
            data.sheepId!,
            data.measurementDate!
        );
        const dailyGain = calculateDailyGain(
            data.weight!,
            data.measurementDate!,
            previous
        );
        const record = await this.create({ ...data, dailyGain }, username);

        const latest = await this.findLatestBySheep(data.sheepId!);
        if (latest?.id === record.id) {
            await (new SheepRepository()).update(data.sheepId!, {
                weight: data.weight!,
                updatedBy: username,
            });
        }

        return record;
    }

    async getWeightHistory(sheepId: string): Promise<Weight[]> {
        return this.find({
            where: { sheepId },
            order: { measurementDate: 'DESC' },
        });
    }

    async findLatestMapBySheepIds(sheepIds: string[]): Promise<Map<string, Weight>> {
        return (this.repository as WeightRepository).findLatestMapBySheepIds(sheepIds);
    }

    async attachLatestWeights<T extends { id: string }>(
        items: T[]
    ): Promise<SheepWithLatestWeight<T>[]> {
        if (items.length === 0) return [];
        const latestBySheep = await this.findLatestMapBySheepIds(items.map(item => item.id));
        return items.map(item => {
            const latest = latestBySheep.get(item.id);
            return {
                ...item,
                latestWeight: latest ? Number(latest.weight) : null,
                latestWeightDate: latest?.measurementDate ?? null,
            };
        });
    }

    async bulkRecordWeights(data: BulkWeightSchedule, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const sheepRepository = new SheepRepository();

        const items: { sheepId: string; weight: number; notes?: string }[] = [];

        if (data.records?.length) {
            for (const record of data.records) {
                items.push(record);
            }
        } else {
            const sheepIds = await resolveSheepIds(sheepRepository, {
                sheepIds: data.sheepIds,
                filters: data.filters,
            });
            for (const sheepId of sheepIds) {
                items.push({
                    sheepId,
                    weight: data.defaultWeight!,
                    notes: data.notes,
                });
            }
        }

        result.total = items.length;
        if (items.length === 0) return result;

        const sheepIds = items.map(i => i.sheepId);
        const sheepById = new Map(
            (await sheepRepository.findByIds(sheepIds)).map(s => [s.id, s])
        );

        for (const item of items) {
            if (!sheepById.has(item.sheepId)) {
                result.failed.push({ sheepId: item.sheepId, error: 'Oveja no encontrada' });
                continue;
            }
            try {
                const record = await this.upsertWeightOnDate(
                    {
                        sheepId: item.sheepId,
                        weight: item.weight,
                        measurementDate: data.measurementDate,
                        notes: item.notes ?? data.notes,
                    },
                    username
                );
                result.succeeded.push({ sheepId: item.sheepId, recordId: record.id });
            } catch (err) {
                result.failed.push({
                    sheepId: item.sheepId,
                    error: err instanceof Error ? err.message : 'No se pudo registrar el peso',
                });
            }
        }

        return result;
    }
}
