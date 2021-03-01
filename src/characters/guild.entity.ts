import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Guild extends BaseEntity {
  @PrimaryGeneratedColumn()
  guildid: number;

  @Column()
  name: string;

  @Column()
  leaderguid: number;

  @Column()
  EmblemStyle: number;

  @Column()
  EmblemColor: number;

  @Column()
  BorderStyle: number;

  @Column()
  BorderColor: number;

  @Column()
  BackgroundColor: number;

  @Column()
  info: string;

  @Column()
  motd: string;

  @Column()
  createdate: number;

  @Column()
  BankMoney: number;
}
