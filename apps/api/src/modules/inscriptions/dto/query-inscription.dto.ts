import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Positive } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryInscriptionDto extends QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_classe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Positive()
  id_annee_scolaire?: number;

  @ApiPropertyOptional({ enum: ['inscrit', 'transfere', 'sorti', 'abandonne'] })
  @IsOptional()
  @IsString()
  statut?: string;
}
