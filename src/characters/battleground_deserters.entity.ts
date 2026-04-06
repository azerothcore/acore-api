import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class BattlegroundDeserters {
  @PrimaryGeneratedColumn()
  guid: number;

  @Column()
  type: number;

  @Column()
  datetime: string;
}
