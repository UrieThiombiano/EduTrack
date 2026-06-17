import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmploisDuTempsService } from './emplois-du-temps.service';
import { CreateEmploiDuTempsDto } from './dto/create-emploi.dto';
import { UpdateEmploiDuTempsDto } from './dto/update-emploi.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('emplois-du-temps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('emplois-du-temps')
export class EmploisDuTempsController {
  constructor(private readonly service: EmploisDuTempsService) {}

  @Get('classe/:classeId')
  @ApiOperation({ summary: 'Emploi du temps d\'une classe (groupé par jour)' })
  findByClasse(@Param('classeId', ParseIntPipe) classeId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByClasse(classeId, user.etablissementId);
  }

  @Get('enseignant/:enseignantId')
  @ApiOperation({ summary: 'Emploi du temps d\'un enseignant' })
  findByEnseignant(@Param('enseignantId', ParseIntPipe) enseignantId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByEnseignant(enseignantId, user.etablissementId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un créneau' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Ajouter un créneau (détecte conflits enseignant et salle)' })
  create(@Body() dto: CreateEmploiDuTempsDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un créneau (ou l\'annuler)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmploiDuTempsDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer un créneau' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
