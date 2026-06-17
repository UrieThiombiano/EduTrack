import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEtablissementDto {
  @ApiProperty({ example: 'Lycée Zinda de Ouagadougou' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom: string;

  @ApiProperty({ example: 'LYC-OUAGA-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code_etablissement: string;

  @ApiPropertyOptional({ example: 'secondaire' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type_etablissement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiPropertyOptional({ example: 'contact@lycee-zinda.bf' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ default: 'Burkina Faso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pays?: string;

  @ApiPropertyOptional({ example: 'Ouagadougou' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;
}
