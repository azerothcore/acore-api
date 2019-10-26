import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterArenaStats extends BaseEntity
{
    @PrimaryColumn()
    guid: number;

    @PrimaryColumn()
    slot: number;

    @Column()
    matchMakerRating: number;

    @Column()
    maxMMR: number;
}
