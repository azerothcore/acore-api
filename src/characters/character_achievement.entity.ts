import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterAchievement extends BaseEntity {
  @PrimaryColumn()
  guid: number;

  @PrimaryColumn()
  achievement: number;

  @Column()
  date: number;
}
