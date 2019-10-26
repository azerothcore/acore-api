import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class ArenaTeamMember extends BaseEntity
{
    @PrimaryGeneratedColumn()
    arenaTeamId: number;

    @PrimaryColumn()
    guid: number;

    @Column()
    weekGames: number;

    @Column()
    weekWins: number;

    @Column()
    seasonGames: number;

    @Column()
    seasonWins: number;

    @Column()
    personalRating: number;
}
