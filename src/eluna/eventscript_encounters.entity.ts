import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class EventscriptEncounters extends BaseEntity {
  @PrimaryColumn()
  time_stamp: number;

  @PrimaryColumn()
  playerGuid: number;

  @Column()
  encounter: string;

  @Column()
  difficulty: number;

  @Column()
  group_type: number;

  @Column()
  duration: number;
}
