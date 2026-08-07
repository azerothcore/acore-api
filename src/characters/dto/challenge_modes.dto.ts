import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ChallengeModeStatus {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
  Dead = 'dead',
}

export enum ChallengeModeSort {
  Rank = 'rank',
  Level = 'level',
  PlayedTime = 'played_time',
  // The date the run ended: the completion date for finished runs, the death date
  // for fallen ones. Runs still going have none and always sort last.
  Date = 'date',
}

export enum ChallengeModeSortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class ChallengeModesLeaderboardQueryDto {
  // Exact bitmask of the challenge combination: Hardcore = 1, Ironman = 2,
  // Bloodthirsty = 4. Each combination is a separate leaderboard, matching the
  // in-game Hall of Fame, since players may only party with the same combination.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  challenge: number;

  @IsOptional()
  @IsEnum(ChallengeModeStatus)
  status?: ChallengeModeStatus = ChallengeModeStatus.All;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(11)
  class?: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ChallengeModeSort)
  sort?: ChallengeModeSort = ChallengeModeSort.Rank;

  @IsOptional()
  @IsEnum(ChallengeModeSortDirection)
  direction?: ChallengeModeSortDirection;
}
