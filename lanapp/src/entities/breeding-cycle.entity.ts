import { BreedingCycleStatus, BreedingResult, DiagnosisType } from '@sheep/domain';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

import { Sheep } from './sheep.entity';
import { Mating } from './mating.entity';

@Entity({ name: 'breeding_cycle', schema: process.env.DATABASE_SCHEMA || 'public' })
export class BreedingCycle extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    eweId!: string;

    @Column()
    cycleName!: string;

    @Column({ nullable: true })
    ramId?: string;

    @Column({ nullable: true })
    matingId?: string;

    @Column({ type: 'date' })
    matingDate!: Date;

    @Column({ type: 'enum', enum: DiagnosisType, nullable: true })
    diagnosisType?: DiagnosisType;

    @Column({ type: 'date', nullable: true })
    diagnosisDate?: Date;

    @Column({ type: 'enum', enum: BreedingResult, nullable: true })
    result?: BreedingResult;

    @Column({ type: 'enum', enum: BreedingCycleStatus, default: BreedingCycleStatus.ACTIVE })
    status!: BreedingCycleStatus;

    @Column({ type: 'boolean', default: false })
    vitaselApplied!: boolean;

    @Column({ type: 'date', nullable: true })
    expectedBirthDate?: Date;

    @Column({ type: 'date', nullable: true })
    actualBirthDate?: Date;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Sheep)
    @JoinColumn({ name: 'eweId' })
    ewe!: Sheep;

    @ManyToOne(() => Sheep, { nullable: true })
    @JoinColumn({ name: 'ramId' })
    ram?: Sheep;

    @ManyToOne(() => Mating, { nullable: true })
    @JoinColumn({ name: 'matingId' })
    mating?: Mating;
}
