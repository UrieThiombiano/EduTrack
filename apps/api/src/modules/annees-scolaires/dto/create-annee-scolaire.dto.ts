import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnneeScolaireDto {
  @ApiProperty({ example: '2024-2025' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  libelle: string;

  @ApiProperty({ example: '2024-10-01' })
  @IsDateString()
  date_debut: string;

  @ApiProperty({ example: '2025-07-31' })
  @IsDateString()
  date_fin: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  est_courante?: boolean;
}
