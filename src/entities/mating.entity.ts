import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MatingStatus } from '@awsp__/utils';
import { Sheep } from './sheep.entity';

@Entity('mating')
export class Mating extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    maleId: string;

    @Column()
    femaleId: string;

    @Column()
    matingDate: Date;

    @Column()
    expectedBirthDate: Date;

    @Column({
        type: 'enum',
        enum: MatingStatus,
    })
    status: MatingStatus;

    @Column()
    matingCount: number;

    @Column()
    effectivenessCounter: number;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    male: Sheep;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    female: Sheep;
}
