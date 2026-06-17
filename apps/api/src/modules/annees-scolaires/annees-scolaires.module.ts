import { Module } from '@nestjs/common';
import { AnneesScolairesController } from './annees-scolaires.controller';
import { AnneesScolairesService } from './annees-scolaires.service';

@Module({
  controllers: [AnneesScolairesController],
  providers: [AnneesScolairesService],
  exports: [AnneesScolairesService],
})
export class AnneesScolairesModule {}
