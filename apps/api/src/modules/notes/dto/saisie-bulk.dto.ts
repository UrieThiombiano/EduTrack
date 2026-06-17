import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateIf, ValidateNested } from 'class-validator';

class NoteBulkItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_eleve: number;

  @ValidateIf((o: NoteBulkItemDto) => !o.est_absent)
  @IsNumber({ maxDecimalPlaces: 2 })
  valeur_note?: number | null;

  @IsOptional()
  @IsBoolean()
  est_absent?: boolean;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class SaisieBulkDto {
  @ApiProperty({ type: [NoteBulkItemDto], description: 'Tableau de notes pour tous les élèves de l\'évaluation' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NoteBulkItemDto)
  notes: NoteBulkItemDto[];
}
