import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Remote extends BaseEntity
{
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number;

    @Column('int')
    @Index('idx_guid')
    guid: number;

    @Column('int')
    type: number;

    @Column('int')
    profession: number;
}
