import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class AccountBanned extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @PrimaryColumn()
  bandate: number;

  @Column()
  unbandate: number;

  @Column()
  bannedby: string;

  @Column()
  banreason: string;

  @Column()
  active: number;
}
