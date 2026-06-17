import { Module } from '@nestjs/common';
import { MatieresController } from './matieres.controller';
import { MatieresService } from './matieres.service';

@Module({
  controllers: [MatieresController],
  providers: [MatieresService],
  exports: [MatieresService],
})
export class MatieresModule {}
