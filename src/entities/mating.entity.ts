import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { MatingStatus } from '@awsp__/utils';
import { Sheep } from './sheep.entity';

@Entity('mating')
export class Mating extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    maleId: string;

    @ManyToOne(() => Sheep)
    @JoinColumn({ name: 'maleId' })
    male: Sheep;

    @Column()
    femaleId: string;

    @ManyToOne(() => Sheep)
    @JoinColumn({ name: 'femaleId' })
    female: Sheep;

    @Column()
    matingDate: Date;

    @Column({ nullable: true })
    expectedBirthDate?: Date;

    @Column({
        type: 'enum',
        enum: MatingStatus,
        default: MatingStatus.PENDING,
    })
    status: MatingStatus;
}
