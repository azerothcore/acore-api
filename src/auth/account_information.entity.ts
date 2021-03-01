import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AccountInformation extends BaseEntity {
  @PrimaryColumn({ unsigned: true, default: 0 })
  id: number;

  @Column({ type: 'varchar', default: '', length: 50 })
  first_name: string;

  @Column({ type: 'varchar', default: '', length: 50 })
  last_name: string;

  @Column({ type: 'varchar', default: '', length: 25, unique: true })
  phone: string;

  @Column({ type: 'int', default: 0, unsigned: true })
  coins: number;

  @Column({ type: 'int', default: 0, unsigned: true })
  points: number;
}
