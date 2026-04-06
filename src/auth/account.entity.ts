import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  salt: Buffer;

  @Column()
  verifier: Buffer;

  @Column()
  reg_mail: string;
}
