import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EtablissementsService } from './etablissements.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';
import { UpdateEtablissementDto } from './dto/update-etablissement.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('etablissements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('etablissements')
export class EtablissementsController {
  constructor(private readonly service: EtablissementsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des établissements' })
  findAll(@Query() query: QueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un établissement' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer un établissement' })
  create(@Body() dto: CreateEtablissementDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un établissement' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEtablissementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('administration')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Désactiver un établissement (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
