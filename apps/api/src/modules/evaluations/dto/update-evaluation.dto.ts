import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateEvaluationDto } from './create-evaluation.dto';
import { IsIn, IsOptional } from 'class-validator';

const STATUTS = ['brouillon', 'valide', 'archive'] as const;

export class UpdateEvaluationDto extends PartialType(OmitType(CreateEvaluationDto, ['id_attribution'] as const)) {
  @ApiPropertyOptional({ enum: STATUTS })
  @IsOptional()
  @IsIn(STATUTS)
  statut?: string;
}
