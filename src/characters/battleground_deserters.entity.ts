import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class BattlegroundDeserters extends BaseEntity {
  @PrimaryGeneratedColumn()
  guid: number;

  @Column()
  type: number;

  @Column()
  datetime: string;
}
