import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
    @CreateDateColumn({ 
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt!: Date;

    @UpdateDateColumn({ 
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date;

    @Column({ name: 'created_by' })
    createdBy!: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy?: string;
}
