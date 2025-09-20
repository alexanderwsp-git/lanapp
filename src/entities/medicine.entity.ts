import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MedicineType } from '@alexanderwsp-git/awsp-utils';
import { MedicineApplication } from './medicine-application.entity';

@Entity({ name: 'medicine', schema: process.env.DATABASE_SCHEMA || 'public' })
export class Medicine extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: MedicineType,
    })
    type!: MedicineType;

    @Column()
    name!: string;

    @Column()
    dosage!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    notes?: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ nullable: true })
    manufacturer?: string;

    @Column({ nullable: true })
    batchNumber?: string;

    @Column({ type: 'date', nullable: true })
    expiryDate?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @OneToMany(() => MedicineApplication, application => application.medicine)
    applications!: MedicineApplication[];
}
