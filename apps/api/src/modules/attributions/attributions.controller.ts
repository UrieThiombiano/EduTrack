import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttributionsService } from './attributions.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { QueryAttributionDto } from './dto/query-attribution.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('attributions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('attributions')
export class AttributionsController {
  constructor(private readonly service: AttributionsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des attributions (pivot central — filtrable par enseignant, classe, matière, année)' })
  findAll(@Query() query: QueryAttributionDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une attribution avec évaluations et emploi du temps' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Attribuer une matière à un enseignant pour une classe/année' })
  create(@Body() dto: CreateAttributionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id/toggle-actif')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer / désactiver une attribution' })
  toggleActif(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.toggleActif(id, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une attribution (bloqué si des évaluations existent)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
