import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMatiereDto {
  @ApiProperty({ example: 'MATH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code_matiere: string;

  @ApiProperty({ example: 'Mathématiques' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  libelle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
