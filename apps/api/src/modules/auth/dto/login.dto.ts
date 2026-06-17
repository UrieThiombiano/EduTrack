import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@lycee-zinda.bf' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'Admin@2024!' })
  @IsString()
  @MinLength(6, { message: 'Mot de passe trop court (min 6 caractères)' })
  password: string;
}
