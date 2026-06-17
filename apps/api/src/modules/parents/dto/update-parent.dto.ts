import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateParentDto } from './create-parent.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateParentDto extends PartialType(OmitType(CreateParentDto, ['password'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
