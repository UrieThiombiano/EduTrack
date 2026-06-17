import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateEleveDto } from './create-eleve.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEleveDto extends PartialType(OmitType(CreateEleveDto, ['password'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
