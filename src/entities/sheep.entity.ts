import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Gender, SheepStatus, BirthType } from '@awsp__/utils';

@Entity('sheep')
export class Sheep extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tag: string;

    @Column({ nullable: true })
    name: string;

    @Column()
    breed: string;

    @Column({
        type: 'enum',
        enum: Gender
    })
    gender: Gender;

    @Column()
    birthDate: Date;

    @Column({
        type: 'enum',
        enum: BirthType
    })
    birthType: BirthType;

    @Column()
    weight: number;

    @Column({
        type: 'enum',
        enum: SheepStatus
    })
    status: SheepStatus;

    @Column()
    isBreedingAnimal: boolean;

    @Column()
    isMalton: boolean;

    @Column()
    isBreastfeeding: boolean;

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
} 