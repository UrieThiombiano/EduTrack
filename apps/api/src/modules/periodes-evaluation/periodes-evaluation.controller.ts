import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PeriodesEvaluationService } from './periodes-evaluation.service';
import { CreatePeriodeEvaluationDto } from './dto/create-periode-evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('periodes-evaluation')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('periodes-evaluation')
export class PeriodesEvaluationController {
  constructor(private readonly service: PeriodesEvaluationService) {}

  @Get('periode/:periodeId')
  @ApiOperation({ summary: 'Périodes d\'évaluation d\'une période (trimestre/semestre)' })
  findByPeriode(@Param('periodeId', ParseIntPipe) periodeId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByPeriode(periodeId, user.etablissementId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une période d\'évaluation' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une période d\'évaluation' })
  create(@Body() dto: CreatePeriodeEvaluationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier une période d\'évaluation' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePeriodeEvaluationDto>, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une période d\'évaluation' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
