import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterBanned extends BaseEntity
{
    @PrimaryColumn()
    guid: number;

    @PrimaryColumn()
    bandate: number;

    @Column()
    unbandate: number;

    @Column()
    bannedby: string;

    @Column()
    banreason: string;

    @Column()
    active: number;
}
