import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnneesScolairesService } from './annees-scolaires.service';
import { CreateAnneeScolaireDto } from './dto/create-annee-scolaire.dto';
import { UpdateAnneeScolaireDto } from './dto/update-annee-scolaire.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('annees-scolaires')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('annees-scolaires')
export class AnneesScolairesController {
  constructor(private readonly service: AnneesScolairesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des années scolaires' })
  findAll(@Query() query: QueryDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get('courante')
  @ApiOperation({ summary: 'Année scolaire en cours' })
  findCourante(@CurrentUser() user: JwtPayload) {
    return this.service.findCourante(user.etablissementId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une année scolaire' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une année scolaire' })
  create(@Body() dto: CreateAnneeScolaireDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier une année scolaire' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnneeScolaireDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Patch(':id/set-courante')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Définir comme année courante (transaction)' })
  setCourante(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.setCourante(id, user.etablissementId);
  }

  @Patch(':id/archiver')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archiver une année scolaire' })
  archiver(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.archiver(id, user.etablissementId);
  }
}
