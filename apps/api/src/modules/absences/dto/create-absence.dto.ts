import { IsInt, IsString, IsBoolean, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAbsenceDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_eleve: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_emploi_du_temps: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_classe: number;

  @ApiProperty({ enum: ['absence', 'retard'] })
  @IsString()
  @IsIn(['absence', 'retard'])
  type_absence: string;

  @ApiProperty()
  @IsDateString()
  date_absence: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heure_absence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_justifie?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif_justification?: string;
}
