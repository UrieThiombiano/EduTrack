import { Module } from '@nestjs/common';
import { EspaceParentController } from './espace-parent.controller';
import { EspaceParentService } from './espace-parent.service';

@Module({
  controllers: [EspaceParentController],
  providers: [EspaceParentService],
})
export class EspaceParentModule {}
