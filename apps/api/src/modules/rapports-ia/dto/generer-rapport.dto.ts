import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenererRapportDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_eleve: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_periode: number;
}
