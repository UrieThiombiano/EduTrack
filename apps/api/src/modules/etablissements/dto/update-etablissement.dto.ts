import { PartialType } from '@nestjs/swagger';
import { CreateEtablissementDto } from './create-etablissement.dto';

export class UpdateEtablissementDto extends PartialType(CreateEtablissementDto) {}
