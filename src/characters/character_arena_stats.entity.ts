import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class CharacterArenaStats {
  @PrimaryColumn()
  guid: number;

  @PrimaryColumn()
  slot: number;

  @Column()
  matchMakerRating: number;

  @Column()
  maxMMR: number;
}
