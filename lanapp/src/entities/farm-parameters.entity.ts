import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/** Single-row farm reproduction settings (defaults seeded on first GET). */
@Entity({ name: 'farm_parameters', schema: process.env.DATABASE_SCHEMA || 'public' })
export class FarmParameters extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'int', default: 147 })
    gestationDays!: number;

    @Column({ type: 'int', default: 30 })
    ecoCheckMinDays!: number;

    @Column({ type: 'int', default: 45 })
    ecoCheckMaxDays!: number;

    @Column({ type: 'int', default: 15 })
    heatCycleDays!: number;

    @Column({ type: 'int', default: 70 })
    weaningDays!: number;
}
