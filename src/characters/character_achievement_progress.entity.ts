import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterAchievementProgress extends BaseEntity {
  @PrimaryColumn()
  guid: number;

  @PrimaryColumn()
  criteria: number;

  @Column()
  counter: number;

  @Column()
  date: number;
}
