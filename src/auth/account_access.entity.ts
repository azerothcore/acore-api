import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class AccountAccess {
  @PrimaryColumn()
  id: number;

  @Column()
  gmlevel: number;

  @Column()
  RealmID: number;

  @Column()
  comment: string;
}
