import { BreedingCycleStatus, BreedingResult, BulkBreedingCycleSchedule, Gender } from '@sheep/domain';
import { BaseService } from './base.service';
import { BreedingCycleRepository } from '../repositories/breeding-cycle.repository';
import { BreedingCycle } from '../entities/breeding-cycle.entity';
import { SheepService } from './sheep.service';
import { BulkResult, emptyBulkResult } from '../utils/bulk-target';

export class BreedingCycleService extends BaseService<BreedingCycle> {
    private sheepService: SheepService;

    constructor() {
        super(new BreedingCycleRepository());
        this.sheepService = new SheepService();
    }

    async findByEwe(eweId: string): Promise<BreedingCycle[]> {
        return (this.repository as BreedingCycleRepository).findByEwe(eweId);
    }

    async findByCycleName(cycleName: string): Promise<BreedingCycle[]> {
        return (this.repository as BreedingCycleRepository).findByCycleName(cycleName);
    }

    async create(data: Partial<BreedingCycle>, username: string): Promise<BreedingCycle> {
        return super.create({ ...data, status: BreedingCycleStatus.ACTIVE }, username);
    }

    async recordDiagnosis(
        id: string,
        data: {
            diagnosisType: BreedingCycle['diagnosisType'];
            diagnosisDate: Date;
            result: BreedingResult;
            vitaselApplied?: boolean;
        },
        username: string
    ): Promise<BreedingCycle | null> {
        const cycle = await this.findOne(id);
        if (!cycle || cycle.status === BreedingCycleStatus.CANCELLED) {
            return null;
        }
        return this.update(id, data, username);
    }

    /**
     * Logical delete for planner rows — keeps audit trail.
     * Only allowed before diagnosis or birth (planning mistakes).
     */
    async cancel(id: string, username: string): Promise<BreedingCycle | null> {
        const cycle = await this.findOne(id);
        if (!cycle) return null;
        if (cycle.status === BreedingCycleStatus.CANCELLED) return cycle;
        if (cycle.diagnosisDate || cycle.actualBirthDate) {
            throw new Error('No se puede cancelar un ciclo con diagnóstico o parto registrado');
        }
        return this.update(id, { status: BreedingCycleStatus.CANCELLED }, username);
    }

    async bulkSchedule(data: BulkBreedingCycleSchedule, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const uniqueEweIds = [...new Set(data.eweIds)];
        result.total = uniqueEweIds.length;

        const ewes = await this.sheepService.findByIds(uniqueEweIds);
        const eweById = new Map(ewes.map(e => [e.id, e]));
        const repo = this.repository as BreedingCycleRepository;

        if (data.ramId) {
            const ram = await this.sheepService.findOne(data.ramId);
            if (!ram) {
                for (const eweId of uniqueEweIds) {
                    result.failed.push({ sheepId: eweId, error: 'Carnero no encontrado' });
                }
                return result;
            }
            if (ram.gender !== Gender.MALE) {
                for (const eweId of uniqueEweIds) {
                    result.failed.push({ sheepId: eweId, error: 'El carnero seleccionado no es macho' });
                }
                return result;
            }
        }

        for (const eweId of uniqueEweIds) {
            const ewe = eweById.get(eweId);
            if (!ewe) {
                result.failed.push({ sheepId: eweId, error: 'Oveja no encontrada' });
                continue;
            }
            if (ewe.gender !== Gender.FEMALE) {
                result.failed.push({ sheepId: eweId, error: 'La oveja no es hembra' });
                continue;
            }

            const existing = await repo.findActiveByEweAndCycle(eweId, data.cycleName);
            if (existing) {
                result.failed.push({
                    sheepId: eweId,
                    error: `Ya existe un ciclo "${data.cycleName}" para esta oveja`,
                });
                continue;
            }

            try {
                const cycle = await this.create(
                    {
                        eweId,
                        cycleName: data.cycleName,
                        ramId: data.ramId,
                        matingDate: data.matingDate,
                        vitaselApplied: data.vitaselApplied,
                        notes: data.notes,
                    },
                    username
                );
                result.succeeded.push({ sheepId: eweId, recordId: cycle.id });
            } catch (err) {
                result.failed.push({
                    sheepId: eweId,
                    error: err instanceof Error ? err.message : 'No se pudo programar el ciclo',
                });
            }
        }

        return result;
    }
}
