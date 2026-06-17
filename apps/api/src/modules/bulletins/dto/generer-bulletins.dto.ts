import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenererBulletinsDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_classe: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id_periode: number;
}
