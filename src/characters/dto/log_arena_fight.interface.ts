interface CharacterMember {
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
}

export interface LogArenaFightResponse {
  fight_id: number;
  type: number;
  winner: number;
  time: string;
  loser: number;
  duration: number;
  winner_tr: number;
  winner_mmr: number;
  winner_tr_change: number;
  loser_tr: number;
  loser_mmr: number;
  loser_tr_change: number;
  currOnline: number;
  level: number;
  winner_name: string;
  loser_name: string;
  winner_members: (CharacterMember | null)[];
  loser_members: (CharacterMember | null)[];
}
