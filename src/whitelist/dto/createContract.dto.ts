import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContractDto {
  @MinLength(2)
  @MaxLength(10)
  @IsString()
  symbolA: string;

  @MinLength(2)
  @MaxLength(10)
  @IsString()
  symbolB: string;
}
