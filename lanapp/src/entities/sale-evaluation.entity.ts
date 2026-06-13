import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'sale_evaluation', schema: process.env.DATABASE_SCHEMA || 'public' })
export class SaleEvaluation extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    sheepId!: string;

    @Column()
    batchPeriod!: string;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    birthWeightAvg?: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    weaningWeight?: number;

    @Column({ type: 'boolean' })
    eligible!: boolean;

    @Column({ nullable: true })
    reason?: string;

    @Column({ type: 'date' })
    evaluatedAt!: Date;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep!: Sheep;
}
