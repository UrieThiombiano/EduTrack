import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Positive } from 'class-validator';

export class CreateLienParentEleveDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_parent: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Positive()
  id_eleve: number;

  @ApiPropertyOptional({ example: 'père', enum: ['père', 'mère', 'tuteur', 'tutrice', 'autre'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type_lien?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  est_contact_principal?: boolean;
}
