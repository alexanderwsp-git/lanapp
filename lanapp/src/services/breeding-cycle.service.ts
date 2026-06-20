import { BreedingCycleStatus, BreedingResult, BulkBreedingCycleSchedule, BulkBreedingCycleConfirm } from '@sheep/domain';
import { BaseService } from './base.service';
import { BreedingCycleRepository } from '../repositories/breeding-cycle.repository';
import { BreedingCycle } from '../entities/breeding-cycle.entity';
import { SheepService } from './sheep.service';
import { MatingService } from './mating.service';
import { PregnancyCheckService } from './pregnancy-check.service';
import { BulkResult, emptyBulkResult } from '../utils/bulk-target';
import { eweBreedingEligibility, ramBreedingEligibility } from '../utils/breeding-eligibility';

export class BreedingCycleService extends BaseService<BreedingCycle> {
    private sheepService: SheepService;
    private matingService: MatingService;
    private pregnancyCheckService: PregnancyCheckService;

    constructor() {
        super(new BreedingCycleRepository());
        this.sheepService = new SheepService();
        this.matingService = new MatingService();
        this.pregnancyCheckService = new PregnancyCheckService();
    }

    async findByEwe(eweId: string): Promise<BreedingCycle[]> {
        return (this.repository as BreedingCycleRepository).findByEwe(eweId);
    }

    async findByCycleName(cycleName: string): Promise<BreedingCycle[]> {
        return (this.repository as BreedingCycleRepository).findByCycleName(cycleName);
    }

    async create(data: Partial<BreedingCycle>, username: string): Promise<BreedingCycle> {
        const ewe = await this.sheepService.findOne(data.eweId!);
        if (!ewe) throw new Error('Oveja no encontrada');
        const eweError = eweBreedingEligibility(ewe);
        if (eweError) throw new Error(eweError);

        if (data.ramId) {
            const ram = await this.sheepService.findOne(data.ramId);
            if (!ram) throw new Error('Carnero no encontrado');
            const ramError = ramBreedingEligibility(ram);
            if (ramError) throw new Error(ramError);
        }

        const repo = this.repository as BreedingCycleRepository;
        const existing = await repo.findActiveByEweAndCycle(data.eweId!, data.cycleName!);
        if (existing) {
            throw new Error(`Ya existe un ciclo "${data.cycleName}" para esta oveja`);
        }

        return super.create({ ...data, status: BreedingCycleStatus.ACTIVE }, username);
    }

    async recordDiagnosis(
        id: string,
        data: {
            diagnosisType: BreedingCycle['diagnosisType'];
            diagnosisDate: Date;
            result: BreedingResult;
            vitaselApplied?: boolean;
            notes?: string;
            nextCheckDate?: Date;
            confirmMating?: boolean;
            confirmMatingDate?: Date;
        },
        username: string
    ): Promise<BreedingCycle | null> {
        let cycle = await this.findOne(id);
        if (!cycle || cycle.status === BreedingCycleStatus.CANCELLED) {
            return null;
        }

        if (!cycle.matingId) {
            if (!data.confirmMating) {
                throw new Error(
                    'Confirma la monta antes del diagnóstico o activa "Confirmar monta al guardar"'
                );
            }
            if (!cycle.ramId) {
                throw new Error('Asigna un reproductor antes de confirmar la monta');
            }
            const matingDate = data.confirmMatingDate ?? new Date();
            cycle = (await this.confirmMating(id, username, { matingDate }))!;
        }

        await this.pregnancyCheckService.recordDiagnosisForMating(
            cycle.matingId!,
            {
                diagnosisType: data.diagnosisType!,
                diagnosisDate: data.diagnosisDate,
                result: data.result,
                notes: data.notes,
                nextCheckDate: data.nextCheckDate,
                vitaselApplied: data.vitaselApplied ?? cycle.vitaselApplied,
            },
            username
        );

        return this.findOne(id);
    }

    /**
     * Records the operational mating (Montas tab) for a planned cycle row.
     * Idempotent when matingId is already set.
     */
    async confirmMating(
        id: string,
        username: string,
        options: { matingDate?: Date } = {}
    ): Promise<BreedingCycle | null> {
        const cycle = await this.findOne(id);
        if (!cycle || cycle.status === BreedingCycleStatus.CANCELLED) {
            return null;
        }
        if (cycle.matingId) {
            return cycle;
        }
        if (!cycle.ramId) {
            throw new Error('Asigna un reproductor antes de confirmar la monta');
        }

        const actualMatingDate = options.matingDate ?? new Date();

        const mating = await this.matingService.recordMating(
            {
                maleId: cycle.ramId,
                femaleId: cycle.eweId,
                matingDate: actualMatingDate,
                notes: cycle.notes
                    ? `Ciclo ${cycle.cycleName}: ${cycle.notes}`
                    : `Ciclo ${cycle.cycleName}`,
            },
            username
        );

        await this.update(id, { matingId: mating.id }, username);
        return this.findOne(id);
    }

    async bulkConfirmMating(data: BulkBreedingCycleConfirm, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const uniqueIds = [...new Set(data.ids)];
        result.total = uniqueIds.length;

        for (const id of uniqueIds) {
            try {
                const cycle = await this.confirmMating(id, username, { matingDate: data.matingDate });
                if (!cycle) {
                    result.failed.push({ sheepId: id, error: 'Ciclo no encontrado' });
                    continue;
                }
                result.succeeded.push({ sheepId: cycle.eweId, recordId: cycle.id });
            } catch (err) {
                const cycle = await this.findOne(id);
                result.failed.push({
                    sheepId: cycle?.eweId ?? id,
                    error: err instanceof Error ? err.message : 'No se pudo confirmar la monta',
                });
            }
        }

        return result;
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
        await this.update(id, { status: BreedingCycleStatus.CANCELLED }, username);
        return this.findOne(id);
    }

    async bulkSchedule(data: BulkBreedingCycleSchedule, username: string): Promise<BulkResult> {
        const result = emptyBulkResult();
        const uniqueEweIds = [...new Set(data.eweIds)];
        result.total = uniqueEweIds.length;

        const ewes = await this.sheepService.findByIds(uniqueEweIds);
        const eweById = new Map(ewes.map(e => [e.id, e]));
        const repo = this.repository as BreedingCycleRepository;

        const ram = await this.sheepService.findOne(data.ramId);
        if (!ram) {
            for (const eweId of uniqueEweIds) {
                result.failed.push({ sheepId: eweId, error: 'Carnero no encontrado' });
            }
            return result;
        }
        const ramError = ramBreedingEligibility(ram);
        if (ramError) {
            for (const eweId of uniqueEweIds) {
                result.failed.push({ sheepId: eweId, error: ramError });
            }
            return result;
        }

        for (const eweId of uniqueEweIds) {
            const ewe = eweById.get(eweId);
            if (!ewe) {
                result.failed.push({ sheepId: eweId, error: 'Oveja no encontrada' });
                continue;
            }
            const eweError = eweBreedingEligibility(ewe);
            if (eweError) {
                result.failed.push({ sheepId: eweId, error: eweError });
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
