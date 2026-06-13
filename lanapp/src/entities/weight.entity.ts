import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'weight', schema: process.env.DATABASE_SCHEMA || 'public' })
export class Weight extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    sheepId!: string;

    @Column()
    weight!: number;

    @Column()
    measurementDate!: Date;

    @Column('decimal', { precision: 6, scale: 2, nullable: true })
    dailyGain?: number;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep!: Sheep;
}
