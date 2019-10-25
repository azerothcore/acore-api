import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class ArenaTeam extends BaseEntity
{
    @PrimaryGeneratedColumn()
    arenaTeamId: number;

    @Column()
    name: string;

    @Column()
    captainGuid: number;

    @Column()
    type: number;

    @Column()
    rating: number;

    @Column()
    seasonGames: number;

    @Column()
    seasonWins: number;

    @Column()
    weekGames: number;

    @Column()
    weekWins: number;

    @Column()
    rank: number;

    @Column()
    backgroundColor: number;

    @Column()
    emblemStyle: number;

    @Column()
    emblemColor: number;

    @Column()
    borderStyle: number;

    @Column()
    borderColor: number;
}
