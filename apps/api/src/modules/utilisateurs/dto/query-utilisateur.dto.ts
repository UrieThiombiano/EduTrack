import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryUtilisateurDto extends QueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par id_role' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_role?: number;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsString()
  est_actif?: string;
}
