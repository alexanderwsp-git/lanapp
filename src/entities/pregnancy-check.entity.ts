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

    @Column({ nullable: true })
    notes?: string;

    @Column({ type: 'date', nullable: true })
    nextCheckDate?: Date;

    @Column({ nullable: true })
    imageUrl?: string;
}
