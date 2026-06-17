import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEleveDto {
  // ── Compte utilisateur ──────────────────────────────────────────
  @ApiProperty({ example: 'Ouédraogo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Ibrahim' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @ApiPropertyOptional({ example: 'ibrahim.ouedraogo@lycee-zinda.bf' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiProperty({ example: 'Eleve@2024!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  // ── Profil élève ────────────────────────────────────────────────
  @ApiProperty({ example: 'ELV-2024-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  matricule: string;

  @ApiPropertyOptional({ example: '2006-03-15' })
  @IsOptional()
  @IsDateString()
  date_naissance?: string;

  @ApiPropertyOptional({ example: 'Ouagadougou' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  lieu_naissance?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsIn(['M', 'F'])
  sexe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numero_extrait_naissance?: string;
}
