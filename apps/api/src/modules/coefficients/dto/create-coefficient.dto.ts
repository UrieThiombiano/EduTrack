import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Max, Min } from 'class-validator';

export class CreateCoefficientDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_matiere: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_niveau: number;

  @ApiProperty({ example: 3, minimum: 0.5, maximum: 10 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(10)
  valeur: number;
}
