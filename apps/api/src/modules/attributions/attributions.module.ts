import { Module } from '@nestjs/common';
import { AttributionsController } from './attributions.controller';
import { AttributionsService } from './attributions.service';

@Module({
  controllers: [AttributionsController],
  providers: [AttributionsService],
  exports: [AttributionsService],
})
export class AttributionsModule {}
