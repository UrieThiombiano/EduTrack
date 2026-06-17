import { PartialType } from '@nestjs/swagger';
import { CreateNiveauDto } from './create-niveau.dto';
export class UpdateNiveauDto extends PartialType(CreateNiveauDto) {}
