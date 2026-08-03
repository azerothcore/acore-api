export interface ChallengeModeCharacter {
  rank: number;
  guid: number;
  account: number;
  name: string;
  race: number;
  class: number;
  gender: number;
  level: number;
  challenge: number;
  completed: number;
  dead: number;
  died_on: number | null;
  char_deleted: number;
  played_time: number | null;
}

export interface ChallengeModeStats {
  challenge: number;
  total: number;
  active: number;
  completed: number;
  dead: number;
}
