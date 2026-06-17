import { Module } from '@nestjs/common';
import { RapportsIaController } from './rapports-ia.controller';
import { RapportsIaService } from './rapports-ia.service';

@Module({
  controllers: [RapportsIaController],
  providers: [RapportsIaService],
  exports: [RapportsIaService],
})
export class RapportsIaModule {}
