import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EspaceParentService } from './espace-parent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('espace-parent')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
@Controller('parent/moi')
export class EspaceParentController {
  constructor(private readonly service: EspaceParentService) {}

  @Get('enfants')
  @ApiOperation({ summary: 'Mes enfants avec résumé (classe, absences, dernier bulletin)' })
  mesEnfants(@CurrentUser() user: JwtPayload) {
    return this.service.mesEnfants(user.sub, user.etablissementId);
  }

  @Get('enfants/:eleveId/notes')
  @ApiOperation({ summary: 'Notes de mon enfant' })
  notes(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.notesEnfant(user.sub, eleveId, user.etablissementId);
  }

  @Get('enfants/:eleveId/absences')
  @ApiOperation({ summary: 'Absences et retards de mon enfant' })
  absences(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.absencesEnfant(user.sub, eleveId, user.etablissementId);
  }

  @Get('enfants/:eleveId/sanctions')
  @ApiOperation({ summary: 'Sanctions de mon enfant' })
  sanctions(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.sanctionsEnfant(user.sub, eleveId, user.etablissementId);
  }

  @Get('enfants/:eleveId/bulletins')
  @ApiOperation({ summary: 'Bulletins publiés de mon enfant' })
  bulletins(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.bulletinsEnfant(user.sub, eleveId, user.etablissementId);
  }

  @Get('enfants/:eleveId/rapports-ia')
  @ApiOperation({ summary: 'Rapports IA de mon enfant (lecture seule)' })
  rapports(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.rapportsEnfant(user.sub, eleveId, user.etablissementId);
  }
}
