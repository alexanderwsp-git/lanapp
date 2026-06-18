import { BaseRepository } from './base.repository';
import { FarmParameters } from '../entities/farm-parameters.entity';

export class FarmParametersRepository extends BaseRepository<FarmParameters> {
    constructor() {
        super(FarmParameters);
    }

    async findSingleton(): Promise<FarmParameters | null> {
        const rows = await this.repository.find({ order: { createdAt: 'ASC' }, take: 1 });
        return rows[0] ?? null;
    }
}
