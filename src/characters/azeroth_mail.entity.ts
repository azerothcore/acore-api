import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class AzerothMail extends BaseEntity
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    guid: number;

    @Column()
    subject: string;

    @Column()
    body: string;

    @Column()
    money: number;

    @Column()
    entry: number;

    @Column()
    count: number;
}
