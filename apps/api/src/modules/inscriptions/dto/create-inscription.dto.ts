import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Positive } from 'class-validator';

export class CreateInscriptionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_eleve: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_classe: number;

  @ApiPropertyOptional({ example: '2024-10-01' })
  @IsOptional()
  @IsDateString()
  date_inscription?: string;
}
