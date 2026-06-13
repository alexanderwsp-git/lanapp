import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'weaning_record', schema: process.env.DATABASE_SCHEMA || 'public' })
export class WeaningRecord extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    sheepId!: string;

    @Column({ type: 'date' })
    weaningDate!: Date;

    @Column('decimal', { precision: 5, scale: 2 })
    weaningWeight!: number;

    @Column('decimal', { precision: 6, scale: 2, nullable: true })
    dailyGain?: number;

    @Column({ nullable: true })
    lotId?: string;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep!: Sheep;
}
