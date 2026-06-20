import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { CreateEtablissementPukriDto } from './dto/create-etablissement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@ApiTags('pukri / super-admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('pukri')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de la plateforme EduTrack' })
  getStats() {
    return this.service.getStats();
  }

  // ── Établissements ─────────────────────────────────────────────────────────
  @Get('etablissements')
  @ApiOperation({ summary: 'Lister tous les établissements clients' })
  listEtablissements(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listEtablissements(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('etablissements/:id')
  @ApiOperation({ summary: 'Détail d\'un établissement' })
  getEtablissement(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEtablissement(id);
  }

  @Post('etablissements')
  @ApiOperation({ summary: 'Créer un nouvel établissement client' })
  createEtablissement(@Body() dto: CreateEtablissementPukriDto) {
    return this.service.createEtablissement(dto);
  }

  @Patch('etablissements/:id')
  @ApiOperation({ summary: 'Modifier un établissement' })
  updateEtablissement(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEtablissementPukriDto>) {
    return this.service.updateEtablissement(id, dto);
  }

  @Patch('etablissements/:id/desactiver')
  @ApiOperation({ summary: 'Désactiver un établissement (soft — conserve les données)' })
  desactiverEtablissement(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactiverEtablissement(id);
  }

  @Delete('etablissements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer définitivement un établissement (uniquement si aucun utilisateur)' })
  deleteEtablissement(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteEtablissement(id);
  }

  // ── Alertes ────────────────────────────────────────────────────────────────
  @Get('alertes')
  @ApiOperation({ summary: 'Dernières requêtes en erreur sur la plateforme (max 200)' })
  getAlerts() {
    return this.service.getAlerts();
  }

  @Delete('alertes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Effacer le journal des alertes' })
  clearAlerts() {
    return this.service.clearAlerts();
  }
}
