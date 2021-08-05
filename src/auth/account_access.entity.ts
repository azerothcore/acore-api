import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class AccountAccess extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  gmlevel: number;

  @Column()
  RealmID: number;

  @Column()
  comment: string;
}
