import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterAchievement {
  @PrimaryColumn()
  guid: number;

  @PrimaryColumn()
  achievement: number;

  @Column()
  date: number;
}
