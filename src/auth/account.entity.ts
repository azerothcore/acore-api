import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ synchronize: false })
@Unique(['username'])
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
