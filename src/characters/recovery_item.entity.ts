import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class RecoveryItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column()
  Guid: number;

  @Column()
  ItemEntry: number;

  @Column()
  Count: number;
}
