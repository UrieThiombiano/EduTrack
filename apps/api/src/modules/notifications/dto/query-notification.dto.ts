import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryNotificationDto extends QueryDto {
  @ApiPropertyOptional({ description: 'true = non lues uniquement' })
  @IsOptional()
  @IsString()
  non_lues?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type_notification?: string;
}
