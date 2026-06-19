import { AnalysisStatus } from '@sheep/domain';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AnalysisTypeEntity } from './analysis-type.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'analysis', schema: process.env.DATABASE_SCHEMA || 'public' })
export class Analysis extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    analysisTypeId!: string;

    @Column()
    sheepId!: string;

    @Column({ type: 'date' })
    scheduledDate!: Date;

    @Column({ type: 'date', nullable: true })
    completedDate?: Date | null;

    @Column({ type: 'enum', enum: AnalysisStatus, default: AnalysisStatus.SCHEDULED })
    status!: AnalysisStatus;

    @Column({ type: 'varchar', nullable: true })
    resultValue?: string | null;

    @Column({ type: 'int', nullable: true })
    famachaScore?: number | null;

    @Column({ type: 'varchar', nullable: true })
    diagnosis?: string | null;

    @Column({ type: 'varchar', nullable: true })
    notes?: string | null;

    @ManyToOne(() => AnalysisTypeEntity, type => type.analyses)
    @JoinColumn({ name: 'analysisTypeId' })
    analysisType?: AnalysisTypeEntity;

    @ManyToOne(() => Sheep)
    @JoinColumn({ name: 'sheepId' })
    sheep?: Sheep;
}
