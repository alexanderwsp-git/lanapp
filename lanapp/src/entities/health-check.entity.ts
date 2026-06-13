import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'health_check', schema: process.env.DATABASE_SCHEMA || 'public' })
export class HealthCheck extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    sheepId!: string;

    @Column({ type: 'date' })
    checkDate!: Date;

    @Column({ type: 'int' })
    famachaScore!: number;

    @Column({ type: 'int', nullable: true })
    aiSuggestedScore?: number;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    weight?: number;

    @Column({ nullable: true })
    notes?: string;

    @Column({ nullable: true })
    confirmedBy?: string;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep!: Sheep;
}
