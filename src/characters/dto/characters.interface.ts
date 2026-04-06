export interface StatusResponse {
  status: string;
}

export interface CharacterAchievementSummary {
  guid: number;
  achievement_points: number;
  account: number;
  name: string;
  level: number;
  race: number;
  class: number;
  gender: number;
}

export interface AchievementProgressEntry {
  achievement: number;
  counter: number;
}

export interface CharacterDetail {
  guid: number;
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
  guildName: string | null;
}

export interface PlayerMonthlyGames {
  character: {
    guid: number;
    name: string;
    level: number;
    race: number;
    gender: number;
    class: number;
  };
  totalGames: number;
  gamesByType: { type: number; game: number }[];
}
