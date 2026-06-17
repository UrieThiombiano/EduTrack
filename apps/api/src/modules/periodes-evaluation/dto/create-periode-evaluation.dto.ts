import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreatePeriodeEvaluationDto {
  @ApiProperty({ example: 1, description: 'ID de la période (trimestre/semestre)' })
  @IsInt()
  @IsPositive()
  id_periode: number;

  @ApiPropertyOptional({ example: 'Devoir 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: '2024-10-15' })
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional({ example: '2024-10-30' })
  @IsOptional()
  @IsDateString()
  date_fin?: string;
}
