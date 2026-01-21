import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class LogArenaFights extends BaseEntity {
  @PrimaryGeneratedColumn()
  fight_id: number;

  @Column()
  time: Date;

  @Column()
  type: number;

  @Column()
  duration: number;

  @Column()
  winner: number;

  @Column()
  winner_tr: number;

  @Column()
  winner_mmr: number;

  @Column()
  winner_tr_change: number;

  @Column()
  loser: number;

  @Column()
  loser_tr: number;

  @Column()
  loser_mmr: number;

  @Column()
  loser_tr_change: number;

  @Column()
  currOnline: number;
}
