import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Positive } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryClasseDto extends QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_annee_scolaire?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_niveau?: number;
}
