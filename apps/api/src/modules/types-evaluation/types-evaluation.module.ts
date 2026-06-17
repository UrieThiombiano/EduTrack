import { Module } from '@nestjs/common';
import { TypesEvaluationController } from './types-evaluation.controller';
import { TypesEvaluationService } from './types-evaluation.service';

@Module({
  controllers: [TypesEvaluationController],
  providers: [TypesEvaluationService],
  exports: [TypesEvaluationService],
})
export class TypesEvaluationModule {}
