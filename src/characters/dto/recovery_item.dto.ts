import { IsInt, IsPositive } from 'class-validator';

export class RecoveryItemDTO {
  @IsInt()
  @IsPositive()
  readonly id: number;

  @IsInt()
  @IsPositive()
  readonly guid: number;
}
