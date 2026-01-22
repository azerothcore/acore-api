import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class LogArenaMemberstats extends BaseEntity {
  @PrimaryColumn()
  fight_id: number;

  @PrimaryColumn()
  member_id: number;

  @Column()
  name: string;

  @Column()
  guid: number;

  @Column()
  team: number;

  @Column()
  account: number;

  @Column()
  ip: string;

  @Column()
  damage: number;

  @Column()
  heal: number;

  @Column()
  kblows: number;
}
