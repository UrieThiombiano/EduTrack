import { Module } from '@nestjs/common';
import { LienParentEleveController } from './lien-parent-eleve.controller';
import { LienParentEleveService } from './lien-parent-eleve.service';

@Module({
  controllers: [LienParentEleveController],
  providers: [LienParentEleveService],
  exports: [LienParentEleveService],
})
export class LienParentEleveModule {}
