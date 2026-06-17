import { Module } from '@nestjs/common';
import { CoefficientsController } from './coefficients.controller';
import { CoefficientsService } from './coefficients.service';

@Module({
  controllers: [CoefficientsController],
  providers: [CoefficientsService],
  exports: [CoefficientsService],
})
export class CoefficientsModule {}
