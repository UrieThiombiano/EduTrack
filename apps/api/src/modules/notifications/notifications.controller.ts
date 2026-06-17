import { Controller, Get, Patch, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications (filtrables : non_lues=true, type_notification)' })
  findAll(@Query() query: QueryNotificationDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.sub, query);
  }

  @Get('count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  countNonLues(@CurrentUser() user: JwtPayload) {
    return this.service.countNonLues(user.sub);
  }

  @Patch(':id/lire')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  marquerLu(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.marquerLu(id, user.sub);
  }

  @Patch('tout-lire')
  @ApiOperation({ summary: 'Marquer toutes mes notifications comme lues' })
  marquerToutLu(@CurrentUser() user: JwtPayload) {
    return this.service.marquerToutLu(user.sub);
  }
}
