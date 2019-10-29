import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ synchronize: false })
export class RecoveryItem extends BaseEntity
{
    @Column()
    Guild: number;

    @PrimaryColumn()
    ItemEntry: number;

    @Column()
    Name: string;

    @Column()
    ItemLevel: number;

    @Column()
    DisplayId: number;

    @Column()
    Quality: number;

    @Column()
    InventoryType: number;

    @Column()
    Material: number;
}
