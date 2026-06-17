import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InscriptionsService } from './inscriptions.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { QueryInscriptionDto } from './dto/query-inscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('inscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('inscriptions')
export class InscriptionsController {
  constructor(private readonly service: InscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des inscriptions (filtrable par classe, année, statut)' })
  findAll(@Query() query: QueryInscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une inscription' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Inscrire un élève dans une classe (vérifie capacité)' })
  create(@Body() dto: CreateInscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Changer le statut d\'une inscription (transfert, sortie…)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une inscription (hard delete — utiliser update statut de préférence)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
