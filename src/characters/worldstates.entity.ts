import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Worldstates {
  @PrimaryColumn()
  entry: number;

  @Column()
  value: number;

  @Column()
  comment: string;
}
