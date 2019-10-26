import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Worldstates extends BaseEntity
{
    @PrimaryColumn()
    entry: number;

    @Column()
    value: number;

    @Column()
    comment: string;
}
