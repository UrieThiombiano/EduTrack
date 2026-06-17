import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePeriodeDto } from './create-periode.dto';

export class UpdatePeriodeDto extends PartialType(OmitType(CreatePeriodeDto, ['id_annee_scolaire'] as const)) {}
