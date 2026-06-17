import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmploiDuTempsDto } from './create-emploi.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEmploiDuTempsDto extends PartialType(OmitType(CreateEmploiDuTempsDto, ['id_attribution'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_annule?: boolean;
}
