import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEnseignantDto {
  // ── Compte utilisateur ──────────────────────────────────────────
  @ApiProperty({ example: 'Kaboré' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Fatima' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ example: 'fatima.kabore@lycee-zinda.bf' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiProperty({ example: 'Passe@2024!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  // ── Profil enseignant ───────────────────────────────────────────
  @ApiProperty({ example: 'ENS-2024-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  matricule: string;

  @ApiPropertyOptional({ example: 'Mathématiques' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialite?: string;

  @ApiPropertyOptional({ example: 'Certifié' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  grade?: string;

  @ApiPropertyOptional({ example: '2020-09-01' })
  @IsOptional()
  @IsDateString()
  date_prise_de_fonction?: string;
}
