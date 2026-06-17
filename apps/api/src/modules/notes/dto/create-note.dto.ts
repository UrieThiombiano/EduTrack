import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min, ValidateIf } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 1, description: 'ID de l\'élève' })
  @IsInt()
  @IsPositive()
  id_eleve: number;

  @ApiPropertyOptional({ example: 14.5, description: 'NULL autorisé uniquement si est_absent = true' })
  @ValidateIf((o: CreateNoteDto) => !o.est_absent)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valeur_note?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  est_absent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}
