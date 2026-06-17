import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PeriodesService } from './periodes.service';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('periodes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('periodes')
export class PeriodesController {
  constructor(private readonly service: PeriodesService) {}

  @Get('annee/:anneeId')
  @ApiOperation({ summary: 'Périodes d\'une année scolaire' })
  findByAnnee(@Param('anneeId', ParseIntPipe) anneeId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByAnnee(anneeId, user.etablissementId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une période' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une période' })
  create(@Body() dto: CreatePeriodeDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier une période' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePeriodeDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une période (si aucun bulletin lié)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
