import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Positive } from 'class-validator';

export class CreateUtilisateurDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_role: number;

  @ApiProperty({ example: 'Traoré' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Moussa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @ApiPropertyOptional({ example: 'moussa.traore@lycee-zinda.bf' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiProperty({ example: 'Passe@2024!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mot de passe trop court (min 8 caractères)' })
  password: string;
}
