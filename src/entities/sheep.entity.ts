import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import {
    Gender,
    SheepStatus,
    BirthType,
    SheepBreed,
    SheepCategory,
    RecordType,
} from '@awsp__/utils';
import { Location } from './location.entity';
import { Mating } from './mating.entity';
import { MedicineApplication } from './medicine-application.entity';

@Entity('sheep')
export class Sheep extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tag: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: SheepBreed,
    })
    breed: SheepBreed;

    @Column({
        type: 'enum',
        enum: Gender,
    })
    gender: Gender;

    @Column()
    birthDate: Date;

    @Column({
        type: 'enum',
        enum: BirthType,
    })
    birthType: BirthType;

    @Column('decimal', { precision: 5, scale: 2 })
    weight: number;

    @Column({
        type: 'enum',
        enum: SheepStatus,
    })
    status: SheepStatus;

    @Column({
        type: 'enum',
        enum: SheepCategory,
    })
    category: SheepCategory;

    @Column({
        type: 'enum',
        enum: RecordType,
    })
    recordType: RecordType;

    @Column({ type: 'date', nullable: true })
    quarantineEndDate?: Date;

    @Column({ type: 'int', default: 0 })
    matingCount: number;

    @Column({ type: 'int', default: 0 })
    effectivenessCount: number;

    @Column({ type: 'timestamp', nullable: true })
    lastMountedDate?: Date;

    @Column({ type: 'boolean', default: false })
    isPregnant: boolean;

    @Column({ type: 'date', nullable: true })
    pregnancyConfirmedAt?: Date;

    @Column({ type: 'date', nullable: true })
    deliveryDate?: Date;

    @Column({ nullable: true })
    motherId: string;

    @Column({ nullable: true })
    fatherId: string;

    @ManyToOne(() => Sheep, { nullable: true })
    @JoinColumn()
    mother: Sheep;

    @ManyToOne(() => Sheep, { nullable: true })
    @JoinColumn()
    father: Sheep;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Location, location => location.sheepBornHere)
    birthLocation: Location;

    @ManyToOne(() => Location, location => location.sheepCurrentlyHere)
    currentLocation: Location;

    @OneToMany(() => Mating, mating => mating.male)
    matingsAsMale: Mating[];

    @OneToMany(() => Mating, mating => mating.female)
    matingsAsFemale: Mating[];

    @OneToMany(() => MedicineApplication, application => application.sheep)
    medicineApplications: MedicineApplication[];
}
