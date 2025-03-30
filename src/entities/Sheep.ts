import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { z } from 'zod';

export const SheepSchema = z.object({
  id: z.string().uuid(),
  tag: z.string(),
  name: z.string().optional(),
  breed: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  birthDate: z.date(),
  weight: z.number().positive(),
  isActive: z.boolean(),
  motherId: z.string().uuid().optional(),
  fatherId: z.string().uuid().optional(),
  lastMountedDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Sheep = z.infer<typeof SheepSchema>;

@Entity('sheep')
export class SheepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tag: string;

  @Column({ nullable: true })
  name?: string;

  @Column()
  breed: string;

  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE'],
  })
  gender: 'MALE' | 'FEMALE';

  @Column({ type: 'date' })
  birthDate: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  weight: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => SheepEntity, { nullable: true })
  mother?: SheepEntity;

  @ManyToOne(() => SheepEntity, { nullable: true })
  father?: SheepEntity;

  @Column({ type: 'date', nullable: true })
  lastMountedDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 