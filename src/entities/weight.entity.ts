import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity('weight')
export class Weight extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    sheepId: string;

    @Column()
    weight: number;

    @Column()
    measurementDate: Date;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep: Sheep;
} 