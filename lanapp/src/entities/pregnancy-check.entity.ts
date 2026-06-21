import { DiagnosisType, PregnancyCheckKind } from '@sheep/domain';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Mating } from './mating.entity';

@Entity({ name: 'pregnancy_check', schema: process.env.DATABASE_SCHEMA || 'public' })
export class PregnancyCheck extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    matingId!: string;

    @ManyToOne(() => Mating, mating => mating.pregnancyChecks)
    @JoinColumn({ name: 'matingId' })
    mating!: Mating;

    @Column({ type: 'date' })
    checkDate!: Date;

    @Column()
    isPregnant!: boolean;

    @Column({ type: 'enum', enum: DiagnosisType, nullable: true })
    checkType?: DiagnosisType;

    @Column({ type: 'enum', enum: PregnancyCheckKind, default: PregnancyCheckKind.DIAGNOSIS })
    kind!: PregnancyCheckKind;

    @Column({ nullable: true })
    notes?: string;

    @Column({ type: 'int', nullable: true })
    offspringBorn?: number | null;

    @Column({ type: 'int', nullable: true })
    offspringAlive?: number | null;

    @Column({ type: 'int', nullable: true })
    offspringLost?: number | null;

    @Column({ type: 'date', nullable: true })
    nextCheckDate?: Date;

    @Column({ nullable: true })
    imageUrl?: string;
}
