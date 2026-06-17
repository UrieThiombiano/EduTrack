import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JustifierAbsenceDto {
  @ApiProperty()
  @IsString()
  motif_justification: string;
}
