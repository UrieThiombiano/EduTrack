import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTypeEvaluationDto {
  @ApiProperty({ example: 'Devoir surveillé' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 30, description: 'Pondération en % dans la moyenne de la période' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  ponderation_pourcentage?: number;
}
