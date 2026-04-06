import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class RecoveryItem {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column()
  Guid: number;

  @Column()
  ItemEntry: number;

  @Column()
  Count: number;
}
