import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Positive } from 'class-validator';

export class CreateClasseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_annee_scolaire: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_niveau: number;

  @ApiProperty({ example: 'TC-A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code_classe: string;

  @ApiProperty({ example: 'Terminale C - A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Positive()
  capacite_max?: number;

  @ApiPropertyOptional({ example: 'Salle 12' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  salle_principale?: string;

  @ApiPropertyOptional({ description: 'ID de l\'enseignant titulaire' })
  @IsOptional()
  @IsInt()
  @Positive()
  id_enseignant_titulaire?: number;
}
