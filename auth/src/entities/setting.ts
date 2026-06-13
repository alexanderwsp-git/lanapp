import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ schema: process.env.DATABASE_SCHEMA || 'public' })
export class Setting extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ unique: true, nullable: false })
    name?: string;

    @Column({ nullable: false })
    type?: string;

    @Column({ nullable: false })
    config?: string;

    @Column({ default: 'Active' })
    status?: string;
}
