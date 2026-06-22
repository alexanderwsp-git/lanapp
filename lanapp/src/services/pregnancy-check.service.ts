import {
    BreedingResult,
    PregnancyCheckKind,
    canRecordDelivery,
    canRecordDiagnosis,
    deriveMatingPhase,
    hasConfirmedPregnancy,
} from '@sheep/domain';
import { BaseService } from './base.service';
import { PregnancyCheckRepository } from '../repositories/pregnancy-check.repository';
import { PregnancyCheck } from '../entities/pregnancy-check.entity';
import { Mating } from '../entities/mating.entity';
import { Sheep } from '../entities/sheep.entity';
import { MatingService } from './mating.service';
import { SheepService } from './sheep.service';
import { BreedingCycleRepository } from '../repositories/breeding-cycle.repository';
import {
    breedingResultToCheckInput,
    checkToBreedingResult,
    formatCheckNotes,
} from '../utils/breeding-diagnosis.utils';

export class PregnancyCheckService extends BaseService<PregnancyCheck> {
    private matingService: MatingService;
    private sheepService: SheepService;
    private breedingCycleRepository: BreedingCycleRepository;

    constructor() {
        super(new PregnancyCheckRepository());
        this.matingService = new MatingService();
        this.sheepService = new SheepService();
        this.breedingCycleRepository = new BreedingCycleRepository();
    }

    async findByMating(matingId: string): Promise<PregnancyCheck[]> {
        return (this.repository as PregnancyCheckRepository).findByMating(matingId);
    }

    async findLatestByMating(matingId: string): Promise<PregnancyCheck | null> {
        return (this.repository as PregnancyCheckRepository).findLatestByMating(matingId);
    }

    async recordCheck(
        data: {
            matingId: string;
            checkDate: Date;
            isPregnant: boolean;
            checkType?: PregnancyCheck['checkType'];
            notes?: string;
            nextCheckDate?: Date;
            vitaselApplied?: boolean;
        },
        username: string
    ): Promise<PregnancyCheck> {
        const mating = await this.matingService.findOne(data.matingId);
        if (!mating) throw new Error('Monta no encontrada');

        const history = await this.findByMating(data.matingId);
        const phase = deriveMatingPhase(history);
        const everPregnant = hasConfirmedPregnancy(history);
        const result = checkToBreedingResult(data.isPregnant, data.nextCheckDate);
        const gate = canRecordDiagnosis(phase, result);
        if (!gate.ok) throw new Error(gate.reason);

        const check = await this.create(
            {
                ...data,
                kind: PregnancyCheckKind.DIAGNOSIS,
                notes: formatCheckNotes(data.checkType, data.notes),
            },
            username
        );

        if (data.isPregnant) {
            await this.matingService.markAsEffective(data.matingId, username);
            await this.sheepService.update(
                mating.femaleId,
                {
                    isPregnant: true,
                    pregnancyConfirmedAt: data.checkDate,
                    lastMountedDate: mating.matingDate,
                },
                username
            );
        } else if (data.nextCheckDate) {
            // Pre-confirmation Revisar: inconclusive. Post-Preñada Revisar: gestation follow-up only.
            if (!everPregnant) {
                await this.sheepService.update(mating.femaleId, { isPregnant: false }, username);
            }
        } else {
            await this.matingService.markAsIneffective(data.matingId, username);
            await this.sheepService.update(
                mating.femaleId,
                {
                    isPregnant: false,
                    pregnancyConfirmedAt: null as unknown as Date,
                },
                username
            );
        }

        await this.syncBreedingCycleSummary(data.matingId, check, data.checkType, username);

        const cycle = await this.breedingCycleRepository.findActiveByMatingId(data.matingId);
        if (cycle && data.vitaselApplied !== undefined) {
            await this.breedingCycleRepository.update(cycle.id, {
                vitaselApplied: data.vitaselApplied,
                updatedBy: username,
            });
        }

        return check;
    }

    async recordDiagnosisForMating(
        matingId: string,
        data: {
            diagnosisType: PregnancyCheck['checkType'];
            diagnosisDate: Date;
            result: BreedingResult;
            notes?: string;
            nextCheckDate?: Date;
            vitaselApplied?: boolean;
        },
        username: string
    ): Promise<PregnancyCheck> {
        const { isPregnant, nextCheckDate } = breedingResultToCheckInput(
            data.result,
            data.nextCheckDate
        );

        const check = await this.recordCheck(
            {
                matingId,
                checkDate: data.diagnosisDate,
                isPregnant,
                checkType: data.diagnosisType,
                notes: data.notes,
                nextCheckDate,
            },
            username
        );

        const cycle = await this.breedingCycleRepository.findActiveByMatingId(matingId);
        if (cycle && data.vitaselApplied !== undefined) {
            await this.breedingCycleRepository.update(cycle.id, {
                vitaselApplied: data.vitaselApplied,
                updatedBy: username,
            });
        }

        return check;
    }

    private async syncBreedingCycleSummary(
        matingId: string,
        check: PregnancyCheck,
        checkType: PregnancyCheck['checkType'],
        username: string
    ): Promise<void> {
        if (check.kind === PregnancyCheckKind.DELIVERY) return;

        const cycle = await this.breedingCycleRepository.findActiveByMatingId(matingId);
        if (!cycle) return;

        const result = checkToBreedingResult(check.isPregnant, check.nextCheckDate);
        await this.breedingCycleRepository.update(cycle.id, {
            diagnosisType: checkType ?? cycle.diagnosisType,
            diagnosisDate: check.checkDate,
            result,
            updatedBy: username,
        });
    }

    async recordDelivery(
        matingId: string,
        data: {
            deliveryDate: Date;
            notes?: string;
            offspringBorn?: number;
            offspringAlive?: number;
            offspringLost?: number;
        },
        username: string
    ): Promise<PregnancyCheck> {
        const mating = await this.matingService.findOne(matingId);
        if (!mating) throw new Error('Monta no encontrada');

        const history = await this.findByMating(matingId);
        const phase = deriveMatingPhase(history);
        const gate = canRecordDelivery(phase);
        if (!gate.ok) throw new Error(gate.reason);

        const check = await this.create(
            {
                matingId,
                checkDate: data.deliveryDate,
                isPregnant: false,
                kind: PregnancyCheckKind.DELIVERY,
                notes: data.notes?.trim() || 'Parto registrado',
                offspringBorn: data.offspringBorn,
                offspringAlive: data.offspringAlive,
                offspringLost: data.offspringLost,
            },
            username
        );

        await this.sheepService.update(
            mating.femaleId,
            {
                isPregnant: false,
                deliveryDate: data.deliveryDate,
                lastMountedDate: data.deliveryDate,
            },
            username
        );

        const cycle = await this.breedingCycleRepository.findActiveByMatingId(matingId);
        if (cycle) {
            await this.breedingCycleRepository.update(cycle.id, {
                actualBirthDate: data.deliveryDate,
                updatedBy: username,
            });
        }

        return check;
    }

    async findPendingDeliveries(): Promise<Array<{ sheep: Sheep; mating: Mating; checks: PregnancyCheck[] }>> {
        const pregnant = await this.sheepService.findPregnant();
        const results: Array<{ sheep: Sheep; mating: Mating; checks: PregnancyCheck[] }> = [];

        for (const sheep of pregnant) {
            const matings = await this.matingService.findBySheep(sheep.id);
            for (const mating of matings) {
                if (mating.femaleId !== sheep.id) continue;
                const checks = await this.findByMating(mating.id);
                const phase = deriveMatingPhase(checks);
                if (canRecordDelivery(phase).ok) {
                    results.push({ sheep, mating, checks });
                    break;
                }
            }
        }

        return results;
    }

    async getCheckHistory(matingId: string): Promise<PregnancyCheck[]> {
        return this.findByMating(matingId);
    }

    async getLatestCheck(matingId: string): Promise<PregnancyCheck | null> {
        return this.findLatestByMating(matingId);
    }
}
