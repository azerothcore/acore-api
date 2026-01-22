import { LogArenaFights } from '../log_arena_fights.entity';
import { LogArenaMemberstats } from '../log_arena_memberstats.entity';

export interface LogArenaFightsStatsResponse {
  fight: LogArenaFights;
  memberStats: LogArenaMemberstats[];
  fight_id_next: number | null;
  fight_id_previous: number | null;
}
