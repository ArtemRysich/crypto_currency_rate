import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContractDto {
  @MinLength(2)
  @MaxLength(10)
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  symbolA: string;

  @MinLength(2)
  @MaxLength(10)
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  symbolB: string;
}
