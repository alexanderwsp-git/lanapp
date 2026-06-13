import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sheep } from './sheep.entity';

@Entity({ name: 'location', schema: process.env.DATABASE_SCHEMA || 'public' })
export class Location extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    address!: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude?: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude?: number;

    @Column({ nullable: true })
    description?: string;

    @OneToMany(() => Sheep, sheep => sheep.birthLocation)
    sheepBornHere!: Sheep[];

    @OneToMany(() => Sheep, sheep => sheep.currentLocation)
    sheepCurrentlyHere!: Sheep[];
}
