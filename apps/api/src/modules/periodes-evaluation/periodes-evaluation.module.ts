import { Module } from '@nestjs/common';
import { PeriodesEvaluationController } from './periodes-evaluation.controller';
import { PeriodesEvaluationService } from './periodes-evaluation.service';

@Module({
  controllers: [PeriodesEvaluationController],
  providers: [PeriodesEvaluationService],
  exports: [PeriodesEvaluationService],
})
export class PeriodesEvaluationModule {}
