import { BulkWeaning, Gender, SheepCategory, SIX_MONTHS_DAYS, WEANING_DAYS } from '@sheep/domain';
import { BaseService } from './base.service';
import { WeaningRecordRepository } from '../repositories/weaning-record.repository';
import { WeaningRecord } from '../entities/weaning-record.entity';
import { WeightService } from './weight.service';
import { SheepService } from './sheep.service';
import { Sheep } from '../entities/sheep.entity';
import { SheepRepository } from '../repositories/sheep.repository';
import { BulkResult, emptyBulkResult, resolveSheepIds } from '../utils/bulk-target';
import { determineCategory } from '../utils/utils';

export class WeaningRecordService extends BaseService<WeaningRecord> {
    private weightService: WeightService;
    private sheepService: SheepService;

    constructor() {
        super(new WeaningRecordRepository());
        this.weightService = new WeightService();
        this.sheepService = new SheepService();
    }

    async findBySheep(sheepId: string): Promise<WeaningRecord[]> {
        return (this.repository as WeaningRecordRepository).findBySheep(sheepId);
    }

    async recordWeaning(data: Partial<WeaningRecord>, username: string): Promise<WeaningRecord> {
        const latestWeight = await this.weightService.findLatestBySheep(data.sheepId!);
        let dailyGain = data.dailyGain;

        if (!dailyGain && latestWeight) {
            const daysDiff =
                (new Date(data.weaningDate!).getTime() -
                    new Date(latestWeight.measurementDate).getTime()) /
                (1000 * 60 * 60 * 24);
            if (daysDiff > 0) {
                dailyGain =
                    ((data.weaningWeight! - Number(latestWeight.weight)) / daysDiff) * 1000;
            }
        }

        const record = await this.create({ ...data, dailyGain }, username);

        const weightNotes = this.buildWeaningWeightNotes(data.lotId, data.notes);

        await this.syncWeaningWeight(
            data.sheepId!,
            data.weaningDate!,
            data.weaningWeight!,
            username,
            weightNotes
        );

        const sheep = await this.sheepService.findOne(data.sheepId!);
        if (sheep) {
            await this.applyWeaningCategory(sheep, data.weaningDate!, username);
        }

        return record;
    }

    private async applyWeaningCategory(
        sheep: Sheep,
        weaningDate: Date,
        username: string
    ): Promise<void> {
        const lambCategories = new Set([SheepCategory.CORDERO, SheepCategory.CORDERA]);
        const weanedCategory =
            sheep.gender === Gender.MALE
                ? SheepCategory.CORDERO_DESTETADO
                : SheepCategory.CORDERA_DESTETADA;

        const category = lambCategories.has(sheep.category as SheepCategory)
            ? weanedCategory
            : determineCategory(sheep.gender, sheep.birthDate, {
                  isPregnant: sheep.isPregnant,
                  isLactating: !!sheep.deliveryDate && !sheep.isPregnant,
                  referenceDate: weaningDate,
              });

        await this.sheepService.update(sheep.id, { category }, username);
    }

    /** Mirror destete weight into the weight time-series (Pesos tab). */
    private buildWeaningWeightNotes(lotId?: string, notes?: string): string {
        const parts = ['Peso de destete'];
        if (lotId?.trim()) parts.push(`lote ${lotId.trim()}`);
        if (notes?.trim()) parts.push(notes.trim());
        return parts.join(' · ');
    }

    /** Mirror destete weight into the weight time-series (Pesos tab). */
    private async syncWeaningWeight(
        sheepId: string,
        weaningDate: Date,
        weaningWeight: number,
        username: string,
        notes?: string
    ): Promise<void> {
        const dateKey = new Date(weaningDate).toISOString().slice(0, 10);
        const existing = await this.weightService.findBySheep(sheepId);
        const alreadyOnDate = existing.some(
            w => new Date(w.measurementDate).toISOString().slice(0, 10) === dateKey
        );
        if (alreadyOnDate) return;

        await this.weightService.recordWeight(
            {
                sheepId,
                weight: weaningWeight,
                measurementDate: weaningDate,
                notes,
            },
            username
        );
    }

    async bulkRecordWeaning(data: BulkWeaning, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const repo = this.repository as WeaningRecordRepository;
        const sheepRepository = new SheepRepository();

        const items: { sheepId: string; weaningWeight: number; notes?: string }[] = [];

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
                    weaningWeight: data.defaultWeight!,
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
        const alreadyWeaned = await repo.findSheepIdsWithRecords(sheepIds);

        for (const item of items) {
            const sheep = sheepById.get(item.sheepId);
            if (!sheep) {
                result.failed.push({ sheepId: item.sheepId, error: 'Oveja no encontrada' });
                continue;
            }
            if (alreadyWeaned.has(item.sheepId)) {
                result.failed.push({ sheepId: item.sheepId, error: 'Ya tiene registro de destete' });
                continue;
            }
            try {
                const record = await this.recordWeaning(
                    {
                        sheepId: item.sheepId,
                        weaningDate: data.weaningDate,
                        weaningWeight: item.weaningWeight,
                        lotId: data.lotId,
                        notes: item.notes ?? data.notes,
                    },
                    username
                );
                await this.applyWeaningCategory(sheep, data.weaningDate, username);
                result.succeeded.push({ sheepId: item.sheepId, recordId: record.id });
            } catch (err) {
                result.failed.push({
                    sheepId: item.sheepId,
                    error: err instanceof Error ? err.message : 'No se pudo registrar el destete',
                });
            }
        }

        return result;
    }

    async getWeaningAlerts(minDays = WEANING_DAYS): Promise<Sheep[]> {
        const { data: allSheep } = await this.sheepService.findAll(1, 10000);
        const repo = this.repository as WeaningRecordRepository;
        const weanedIds = await repo.findSheepIdsWithRecords(allSheep.map(s => s.id));
        const lambCategories = new Set([SheepCategory.CORDERO, SheepCategory.CORDERA]);

        const alerts = allSheep.filter(s => {
            if (weanedIds.has(s.id)) return false;
            if (!lambCategories.has(s.category as SheepCategory)) return false;
            const ageDays =
                (Date.now() - new Date(s.birthDate).getTime()) / (1000 * 60 * 60 * 24);
            return ageDays >= minDays;
        });

        return this.weightService.attachLatestWeights(alerts);
    }
}
