import { BaseService } from './base.service';
import { AnalysisTypeRepository } from '../repositories/analysis-type.repository';
import { AnalysisTypeEntity } from '../entities/analysis-type.entity';

export class AnalysisTypeService extends BaseService<AnalysisTypeEntity> {
    constructor() {
        super(new AnalysisTypeRepository());
    }
}
