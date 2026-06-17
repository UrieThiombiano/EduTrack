import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 1, description: 'Attribution (enseignant × classe × matière × année)' })
  @IsInt()
  @IsPositive()
  id_attribution: number;

  @ApiProperty({ example: 1, description: 'Période d\'évaluation (Devoir 1, Composition…)' })
  @IsInt()
  @IsPositive()
  id_periode_evaluation: number;

  @ApiProperty({ example: 1, description: 'Type d\'évaluation (Devoir, Composition…)' })
  @IsInt()
  @IsPositive()
  id_type_evaluation: number;

  @ApiPropertyOptional({ example: 'Devoir n°1 — Fonctions dérivées' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  intitule?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  note_maximale?: number;

  @ApiPropertyOptional({ example: '2024-11-15' })
  @IsOptional()
  @IsDateString()
  date_evaluation?: string;
}
