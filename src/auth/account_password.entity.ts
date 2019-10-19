import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AccountPassword extends BaseEntity
{
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number;

    @Column({ type: 'timestamp', nullable: true, default: null })
    password_changed_at: Date;

    @Column({ type: 'timestamp', nullable: true, default: null })
    password_reset_expires: Date;

    @Column({ nullable: true, default: null, collation: 'utf8_general_ci' })
    password_reset_token: string;
}
