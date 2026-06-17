import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateEnseignantDto } from './create-enseignant.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEnseignantDto extends PartialType(OmitType(CreateEnseignantDto, ['password'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
