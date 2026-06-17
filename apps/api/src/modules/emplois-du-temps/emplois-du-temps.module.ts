import { Module } from '@nestjs/common';
import { EmploisDuTempsController } from './emplois-du-temps.controller';
import { EmploisDuTempsService } from './emplois-du-temps.service';

@Module({
  controllers: [EmploisDuTempsController],
  providers: [EmploisDuTempsService],
  exports: [EmploisDuTempsService],
})
export class EmploisDuTempsModule {}
