import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSanctionDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_eleve: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_classe: number;

  @ApiProperty({ description: 'avertissement | blâme | exclusion_temporaire | exclusion_definitive | etc.' })
  @IsString()
  type_sanction: string;

  @ApiProperty()
  @IsString()
  motif: string;

  @ApiProperty()
  @IsDateString()
  date_sanction: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut_effet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin_effet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
