import { PartialType } from '@nestjs/swagger';
import { CreateAnneeScolaireDto } from './create-annee-scolaire.dto';

export class UpdateAnneeScolaireDto extends PartialType(CreateAnneeScolaireDto) {}
