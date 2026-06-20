import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEtablissementPukriDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  nom: string;

  @ApiProperty({ example: 'LYC-BF-002' })
  @IsString()
  @MaxLength(50)
  code_etablissement: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ default: 'Burkina Faso' })
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ example: 'secondaire' })
  @IsOptional()
  @IsString()
  type_etablissement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;
}
