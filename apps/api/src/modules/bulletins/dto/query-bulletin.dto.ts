import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryBulletinDto extends QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_eleve?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_periode?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_classe?: number;

  @ApiPropertyOptional({ description: 'true / false' })
  @IsOptional()
  @IsString()
  est_publie?: string;
}
