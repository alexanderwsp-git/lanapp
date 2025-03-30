import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MedicineType } from '@awsp__/utils';
import { MedicineApplication } from './medicine-application.entity';

@Entity('medicine')
export class Medicine extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: MedicineType,
    })
    type: MedicineType;

    @Column()
    name: string;

    @Column()
    dosage: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    notes: string;

    @OneToMany(() => MedicineApplication, application => application.medicine)
    applications: MedicineApplication[];
}
