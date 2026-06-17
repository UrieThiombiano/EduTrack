import { Module } from '@nestjs/common';
import { PeriodesController } from './periodes.controller';
import { PeriodesService } from './periodes.service';

@Module({
  controllers: [PeriodesController],
  providers: [PeriodesService],
  exports: [PeriodesService],
})
export class PeriodesModule {}
