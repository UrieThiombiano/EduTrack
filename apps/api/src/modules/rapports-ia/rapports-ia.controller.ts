import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RapportsIaService } from './rapports-ia.service';
import { GenererRapportDto } from './dto/generer-rapport.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { QueryDto } from '../../common/dto/query.dto';

@ApiTags('rapports-ia')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('rapports-ia')
export class RapportsIaController {
  constructor(private readonly service: RapportsIaService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les rapports IA de l\'établissement' })
  findAll(@Query() query: QueryDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get('eleve/:eleveId')
  @ApiOperation({ summary: 'Historique des rapports IA d\'un élève' })
  findByEleve(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByEleve(eleveId, user.etablissementId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un rapport IA' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post('generer')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Générer un rapport IA pour un élève sur une période (nécessite un bulletin publié)',
    description: 'Appelle claude-sonnet-4-6 pour analyser la trajectoire scolaire. Upsert si rapport déjà existant.',
  })
  generer(@Body() dto: GenererRapportDto, @CurrentUser() user: JwtPayload) {
    return this.service.generer(dto, user.etablissementId);
  }
}
