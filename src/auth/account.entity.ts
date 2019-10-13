import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Account extends BaseEntity
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    sha_pass_hash: string;

    @Column()
    reg_mail: string;
}
