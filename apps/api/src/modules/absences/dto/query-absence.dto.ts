import { IsInt, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryAbsenceDto extends QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_eleve?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_classe?: number;

  @ApiPropertyOptional({ enum: ['absence', 'retard'] })
  @IsOptional()
  @IsString()
  @IsIn(['absence', 'retard'])
  type_absence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  est_justifie?: string;
}
