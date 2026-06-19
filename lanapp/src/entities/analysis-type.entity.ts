import { AnalysisKind, MedicineType } from '@sheep/domain';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Analysis } from './analysis.entity';

@Entity({ name: 'analysis_type', schema: process.env.DATABASE_SCHEMA || 'public' })
export class AnalysisTypeEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: AnalysisKind })
    type!: AnalysisKind;

    @Column()
    name!: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column({ type: 'varchar', nullable: true })
    defaultUnit?: string;

    @Column({ type: 'enum', enum: MedicineType, nullable: true })
    recommendedMedicineType?: MedicineType;

    @OneToMany(() => Analysis, analysis => analysis.analysisType)
    analyses!: Analysis[];
}
