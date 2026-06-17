import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

const STATUTS = ['inscrit', 'transfere', 'sorti', 'abandonne'] as const;

export class UpdateInscriptionDto {
  @ApiPropertyOptional({ enum: STATUTS })
  @IsOptional()
  @IsIn(STATUTS)
  statut?: string;

  @ApiPropertyOptional({ example: '2025-01-10' })
  @IsOptional()
  @IsDateString()
  date_sortie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif_sortie?: string;
}
