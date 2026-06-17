import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateNiveauDto {
  @ApiProperty({ example: 'Terminale C' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordre_affichage?: number;

  @ApiPropertyOptional({ example: 'secondaire_2', enum: ['secondaire_1', 'secondaire_2'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cycle?: string;
}
