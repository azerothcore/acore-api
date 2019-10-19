import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: false })
export class Characters extends BaseEntity
{
    @PrimaryGeneratedColumn()
    guid: number;

    @Column()
    account: number;

    @Column()
    name: string;

    @Column()
    race: number;

    @Column()
    class: number;

    @Column()
    gender: number;

    @Column()
    level: number;

    @Column()
    xp: number;

    @Column()
    money: number;

    @Column()
    skin: number;

    @Column()
    face: number;

    @Column()
    hairStyle: number;

    @Column()
    hairColor: number;

    @Column()
    facialStyle: number;

    @Column()
    bankSlots: number;

    @Column()
    restState: number;

    @Column()
    playerFlags: number;

    @Column()
    position_x: number;

    @Column()
    position_y: number;

    @Column()
    position_z: number;

    @Column()
    map: number;

    @Column()
    instance_id: number;

    @Column()
    instance_mode_mask: number;

    @Column()
    orientation: number;

    @Column()
    taximask: string;

    @Column()
    online: number;

    @Column()
    cinematic: number;

    @Column()
    totaltime: number;

    @Column()
    leveltime: number;

    @Column()
    logout_time: number;

    @Column()
    is_logout_resting: number;

    @Column()
    rest_bonus: number;

    @Column()
    resettalents_cost: number;

    @Column()
    resettalents_time: number;

    @Column()
    trans_x: number;

    @Column()
    trans_y: number;

    @Column()
    trans_z: number;

    @Column()
    trans_o: number;

    @Column()
    transguid: number;

    @Column()
    extra_flags: number;

    @Column()
    stable_slots: number;

    @Column()
    at_login: number;

    @Column()
    zone: number;

    @Column()
    death_expire_time: number;

    @Column()
    taxi_path: string;

    @Column()
    arenaPoints: number;

    @Column()
    totalHonorPoints: number;

    @Column()
    todayHonorPoints: number;

    @Column()
    yesterdayHonorPoints: number;

    @Column()
    totalKills: number;

    @Column()
    todayKills: number;

    @Column()
    yesterdayKills: number;

    @Column()
    chosenTitle: number;

    @Column()
    knownCurrencies: number;

    @Column()
    watchedFaction: number;

    @Column()
    drunk: number;

    @Column()
    health: number;

    @Column()
    power1: number;

    @Column()
    power2: number;

    @Column()
    power3: number;

    @Column()
    power4: number;

    @Column()
    power5: number;

    @Column()
    power6: number;

    @Column()
    power7: number;

    @Column()
    latency: number;

    @Column()
    talentGroupsCount: number;

    @Column()
    activeTalentGroup: number;

    @Column()
    exploredZones: string;

    @Column()
    equipmentCache: string;

    @Column()
    ammoId: number;

    @Column()
    knownTitles: string;

    @Column()
    actionBars: number;

    @Column()
    grantableLevels: number;

    @Column()
    creation_date: number;

    @Column()
    deleteInfos_Account: number;

    @Column()
    deleteInfos_Name: string;

    @Column()
    deleteDate: number;
}
