import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class EventscriptScore extends BaseEntity {
  @PrimaryColumn()
  account_id: number;

  @Column()
  score_earned_current: number;

  @Column()
  score_earned_total: string;
}
