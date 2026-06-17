import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Positive } from 'class-validator';

export class CreatePeriodeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_annee_scolaire: number;

  @ApiProperty({ example: 'trimestre', enum: ['trimestre', 'semestre'] })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  type_periode: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  numero_ordre: number;

  @ApiPropertyOptional({ example: '1er Trimestre' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  libelle?: string;

  @ApiPropertyOptional({ example: '2024-10-01' })
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  date_fin?: string;
}
