import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { QueryEvaluationDto } from './dto/query-evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('evaluations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly service: EvaluationsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des évaluations (filtrable par attribution, classe, période, statut)' })
  findAll(@Query() query: QueryEvaluationDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une évaluation avec toutes les notes' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une évaluation (statut : brouillon)' })
  create(@Body() dto: CreateEvaluationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier une évaluation en brouillon' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEvaluationDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Patch(':id/valider')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider une évaluation (notes saisies requises)' })
  valider(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.valider(id, user.etablissementId);
  }

  @Delete(':id')
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une évaluation (brouillon seulement)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
