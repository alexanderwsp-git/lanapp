import { BaseRepository } from './base.repository';
import { AnalysisTypeEntity } from '../entities/analysis-type.entity';

export class AnalysisTypeRepository extends BaseRepository<AnalysisTypeEntity> {
    constructor() {
        super(AnalysisTypeEntity);
    }
}
