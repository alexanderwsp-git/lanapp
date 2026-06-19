import { AnalysisStatus } from '@sheep/domain';
import { BaseRepository } from './base.repository';
import { Analysis } from '../entities/analysis.entity';

export class AnalysisRepository extends BaseRepository<Analysis> {
    constructor() {
        super(Analysis);
    }

    async findBySheep(sheepId: string): Promise<Analysis[]> {
        return this.repository.find({
            where: { sheepId },
            relations: ['analysisType', 'sheep'],
            order: { scheduledDate: 'DESC' },
        });
    }

    async findPending(): Promise<Analysis[]> {
        const today = new Date().toISOString().slice(0, 10);
        return this.repository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.analysisType', 'analysisType')
            .leftJoinAndSelect('a.sheep', 'sheep')
            .where('a.status = :status', { status: AnalysisStatus.SCHEDULED })
            .andWhere('a.scheduledDate <= :today', { today })
            .orderBy('a.scheduledDate', 'ASC')
            .getMany();
    }

    async findFamachaAlerts(maxScore = 2): Promise<Analysis[]> {
        return this.repository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.analysisType', 'analysisType')
            .leftJoinAndSelect('a.sheep', 'sheep')
            .where('a.status = :status', { status: AnalysisStatus.COMPLETED })
            .andWhere('a.famachaScore IS NOT NULL')
            .andWhere('a.famachaScore <= :maxScore', { maxScore })
            .orderBy('a.completedDate', 'DESC')
            .getMany();
    }

    async findWithRelations(id: string): Promise<Analysis | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['analysisType', 'sheep'],
        });
    }

    async findAllWithRelations(page: number, limit: number): Promise<{ data: Analysis[]; total: number }> {
        const [data, total] = await this.repository.findAndCount({
            relations: ['analysisType', 'sheep'],
            skip: (page - 1) * limit,
            take: limit,
            order: { scheduledDate: 'DESC' },
        });
        return { data, total };
    }
}
