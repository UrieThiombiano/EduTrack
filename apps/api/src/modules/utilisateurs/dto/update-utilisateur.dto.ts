import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUtilisateurDto } from './create-utilisateur.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUtilisateurDto extends PartialType(OmitType(CreateUtilisateurDto, ['password'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
