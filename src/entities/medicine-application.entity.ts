import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MedicineStatus } from '@alexanderwsp-git/awsp-utils';
import { Medicine } from './medicine.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'medicine_application', schema: process.env.DATABASE_SCHEMA || 'public' })
export class MedicineApplication extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    medicineId!: string;

    @Column()
    sheepId!: string;

    @Column()
    applicationDate!: Date;

    @Column({ nullable: true })
    nextApplicationDate?: Date;

    @Column({
        type: 'enum',
        enum: MedicineStatus,
    })
    status!: MedicineStatus;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Medicine)
    @JoinColumn()
    medicine!: Medicine;

    @ManyToOne(() => Sheep)
    @JoinColumn()
    sheep!: Sheep;
}
