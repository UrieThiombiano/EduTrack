import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'Sawadogo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Aminata' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+22670000000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telephone: string;

  @ApiProperty({ example: 'Passe@2024!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Commerçante' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;
}
