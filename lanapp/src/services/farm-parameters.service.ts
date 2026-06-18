import {
    DEFAULT_REPRODUCTION_PARAMETERS,
    ReproductionParameters,
    ReproductionParametersSchema,
} from '@sheep/domain';
import { BaseService } from './base.service';
import { FarmParametersRepository } from '../repositories/farm-parameters.repository';
import { FarmParameters } from '../entities/farm-parameters.entity';

function toParams(row: FarmParameters): ReproductionParameters {
    return {
        gestationDays: row.gestationDays,
        ecoCheckMinDays: row.ecoCheckMinDays,
        ecoCheckMaxDays: row.ecoCheckMaxDays,
        heatCycleDays: row.heatCycleDays,
        weaningDays: row.weaningDays,
    };
}

export class FarmParametersService extends BaseService<FarmParameters> {
    constructor() {
        super(new FarmParametersRepository());
    }

    async getParameters(): Promise<ReproductionParameters> {
        const row = await (this.repository as FarmParametersRepository).findSingleton();
        if (!row) return { ...DEFAULT_REPRODUCTION_PARAMETERS };
        return toParams(row);
    }

    async updateParameters(
        data: ReproductionParameters,
        username: string
    ): Promise<ReproductionParameters> {
        const parsed = ReproductionParametersSchema.parse(data);
        const repo = this.repository as FarmParametersRepository;
        let row = await repo.findSingleton();

        if (!row) {
            row = await this.create(
                {
                    ...parsed,
                },
                username
            );
        } else {
            const updated = await this.update(row.id, parsed, username);
            if (!updated) throw new Error('No se pudieron guardar los parámetros');
            row = updated;
        }

        return toParams(row);
    }
}
