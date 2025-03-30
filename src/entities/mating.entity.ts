import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { MatingStatus } from '@awsp__/utils';
import { Sheep } from './sheep.entity';
import { PregnancyCheck } from './pregnancy-check.entity';

@Entity('mating')
export class Mating extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    maleId: string;

    @Column()
    femaleId: string;

    @ManyToOne(() => Sheep, sheep => sheep.matingsAsMale)
    @JoinColumn({ name: 'maleId' })
    male: Sheep;

    @ManyToOne(() => Sheep, sheep => sheep.matingsAsFemale)
    @JoinColumn({ name: 'femaleId' })
    female: Sheep;

    @Column({ type: 'date' })
    matingDate: Date;

    @Column({ type: 'date', nullable: true })
    expectedBirthDate?: Date;

    @Column({
        type: 'enum',
        enum: MatingStatus,
        default: MatingStatus.PENDING,
    })
    status: MatingStatus;

    @OneToMany(() => PregnancyCheck, check => check.mating)
    pregnancyChecks: PregnancyCheck[];
}
