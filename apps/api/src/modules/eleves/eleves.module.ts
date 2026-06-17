import { Module } from '@nestjs/common';
import { ElevesController } from './eleves.controller';
import { ElevesService } from './eleves.service';

@Module({
  controllers: [ElevesController],
  providers: [ElevesService],
  exports: [ElevesService],
})
export class ElevesModule {}
