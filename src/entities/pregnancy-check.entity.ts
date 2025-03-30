import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Mating } from './mating.entity';

@Entity('pregnancy_check')
export class PregnancyCheck extends BaseEntity {
    @Column()
    matingId: string;

    @ManyToOne(() => Mating, mating => mating.pregnancyChecks)
    @JoinColumn({ name: 'matingId' })
    mating: Mating;

    @Column({ type: 'date' })
    checkDate: Date;

    @Column()
    isPregnant: boolean;

    @Column({ nullable: true })
    notes?: string;

    @Column({ type: 'date', nullable: true })
    nextCheckDate?: Date;

    @Column({ nullable: true })
    imageUrl?: string;
}
