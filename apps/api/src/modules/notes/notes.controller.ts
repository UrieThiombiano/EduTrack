import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { SaisieBulkDto } from './dto/saisie-bulk.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('notes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get('evaluation/:evaluationId')
  @ApiOperation({ summary: 'Toutes les notes d\'une évaluation + stats (min, max, moyenne, absents)' })
  findByEvaluation(@Param('evaluationId', ParseIntPipe) evaluationId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByEvaluation(evaluationId, user.etablissementId);
  }

  @Get('eleve/:eleveId')
  @ApiOperation({ summary: 'Toutes les notes d\'un élève (optionnellement filtrées par classe)' })
  findByEleve(
    @Param('eleveId', ParseIntPipe) eleveId: number,
    @CurrentUser() user: JwtPayload,
    @Query('classeId') classeId?: string,
  ) {
    return this.service.findByEleve(eleveId, user.etablissementId, classeId ? parseInt(classeId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une note' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post('evaluation/:evaluationId')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Saisir une note individuelle' })
  create(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(evaluationId, dto, user.sub, user.etablissementId);
  }

  @Post('evaluation/:evaluationId/bulk')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Saisie groupée (upsert) — toutes les notes d\'une évaluation en une requête' })
  saisieBulk(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() dto: SaisieBulkDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.saisieBulk(evaluationId, dto, user.sub, user.etablissementId);
  }

  @Patch(':id')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Corriger une note (brouillon ou validé — impossible si archivé)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateNoteDto>, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une note (évaluation en brouillon uniquement)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
