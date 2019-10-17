import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Post extends BaseEntity
{
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text' })
    body: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
