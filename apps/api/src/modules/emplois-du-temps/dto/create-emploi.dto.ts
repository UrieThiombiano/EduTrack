import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsIn, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, IsPositive } from 'class-validator';

const JOURS = [1, 2, 3, 4, 5, 6] as const; // 1=Lun … 6=Sam

export class CreateEmploiDuTempsDto {
  @ApiProperty({ example: 1, description: 'ID attribution (enseignant × classe × matière × année)' })
  @IsInt()
  @IsPositive()
  id_attribution: number;

  @ApiProperty({ example: 1, description: '1=Lundi … 6=Samedi', minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  jour_semaine: number;

  @ApiProperty({ example: '08:00', description: 'Format HH:mm' })
  @IsString()
  @IsNotEmpty()
  heure_debut: string;

  @ApiProperty({ example: '10:00', description: 'Format HH:mm' })
  @IsString()
  @IsNotEmpty()
  heure_fin: string;

  @ApiPropertyOptional({ example: 'Salle 12' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  salle?: string;

  @ApiPropertyOptional({ example: '2024-10-01', description: 'Si cours unique (pas récurrent)' })
  @IsOptional()
  @IsDateString()
  date_effective?: string;
}
