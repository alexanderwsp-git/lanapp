import { AnalysisStatus, BulkAnalysisSchedule } from '@sheep/domain';
import { BaseService } from './base.service';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { Analysis } from '../entities/analysis.entity';
import { SheepRepository } from '../repositories/sheep.repository';
import { BulkResult, emptyBulkResult, resolveSheepIds } from '../utils/bulk-target';

export class AnalysisService extends BaseService<Analysis> {
    constructor() {
        super(new AnalysisRepository());
    }

    async findBySheep(sheepId: string): Promise<Analysis[]> {
        return (this.repository as AnalysisRepository).findBySheep(sheepId);
    }

    async findPending(): Promise<Analysis[]> {
        return (this.repository as AnalysisRepository).findPending();
    }

    async findFamachaAlerts(maxScore = 2): Promise<Analysis[]> {
        return (this.repository as AnalysisRepository).findFamachaAlerts(maxScore);
    }

    async findAllWithRelations(page: number, limit: number) {
        return (this.repository as AnalysisRepository).findAllWithRelations(page, limit);
    }

    async findWithRelations(id: string): Promise<Analysis | null> {
        return (this.repository as AnalysisRepository).findWithRelations(id);
    }

    async bulkSchedule(data: BulkAnalysisSchedule, username: string): Promise<BulkResult> {
        const sheepRepository = new SheepRepository();
        const sheepIds = await resolveSheepIds(sheepRepository, data);
        const result = emptyBulkResult();
        result.total = sheepIds.length;

        for (const sheepId of sheepIds) {
            try {
                const record = await this.create(
                    {
                        analysisTypeId: data.analysisTypeId,
                        sheepId,
                        scheduledDate: data.scheduledDate,
                        status: AnalysisStatus.SCHEDULED,
                        notes: data.notes,
                    },
                    username
                );
                result.succeeded.push({ sheepId, recordId: record.id });
            } catch (err) {
                result.failed.push({
                    sheepId,
                    error: err instanceof Error ? err.message : 'No se pudo programar',
                });
            }
        }

        return result;
    }
}
