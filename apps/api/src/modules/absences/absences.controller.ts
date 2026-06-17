import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { QueryAbsenceDto } from './dto/query-absence.dto';
import { JustifierAbsenceDto } from './dto/justifier-absence.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('absences')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('absences')
export class AbsencesController {
  constructor(private readonly service: AbsencesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des absences filtrée par élève / classe / date / type' })
  findAll(@Query() query: QueryAbsenceDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une absence' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('enseignant', 'administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Déclarer une absence — notifie automatiquement les parents' })
  create(@Body() dto: CreateAbsenceDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub, user.etablissementId);
  }

  @Patch(':id/justifier')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Justifier une absence' })
  justifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JustifierAbsenceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.justifier(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une absence' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
