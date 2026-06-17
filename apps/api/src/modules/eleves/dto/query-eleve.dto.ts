import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Positive } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryEleveDto extends QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_classe?: number;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsString()
  sexe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_annee_scolaire?: number;
}
