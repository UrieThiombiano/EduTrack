import { Module } from '@nestjs/common';
import { EnseignantsController } from './enseignants.controller';
import { EnseignantsService } from './enseignants.service';

@Module({
  controllers: [EnseignantsController],
  providers: [EnseignantsService],
  exports: [EnseignantsService],
})
export class EnseignantsModule {}
