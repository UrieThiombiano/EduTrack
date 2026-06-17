import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateAttributionDto {
  @ApiProperty({ example: 1, description: 'ID de l\'enseignant' })
  @IsInt()
  @IsPositive()
  id_enseignant: number;

  @ApiProperty({ example: 1, description: 'ID de la classe' })
  @IsInt()
  @IsPositive()
  id_classe: number;

  @ApiProperty({ example: 1, description: 'ID de la matière' })
  @IsInt()
  @IsPositive()
  id_matiere: number;

  @ApiProperty({ example: 1, description: 'ID de l\'année scolaire' })
  @IsInt()
  @IsPositive()
  id_annee_scolaire: number;
}
