import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Mating } from './mating.entity';

@Entity('pregnancy_checks')
export class PregnancyCheck extends BaseEntity {
    @Column()
    matingId: string;

    @ManyToOne(() => Mating)
    @JoinColumn({ name: 'matingId' })
    mating: Mating;

    @Column()
    checkDate: Date;

    @Column()
    isPregnant: boolean;

    @Column({ nullable: true })
    notes?: string;

    @Column({ nullable: true })
    nextCheckDate?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
