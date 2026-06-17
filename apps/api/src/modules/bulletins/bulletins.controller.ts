import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { BulletinsService } from './bulletins.service';
import { BulletinPdfService } from './bulletin-pdf.service';
import { GenererBulletinsDto } from './dto/generer-bulletins.dto';
import { QueryBulletinDto } from './dto/query-bulletin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('bulletins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('bulletins')
export class BulletinsController {
  constructor(
    private readonly service: BulletinsService,
    private readonly pdfService: BulletinPdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des bulletins (filtrables : élève, classe, période, est_publie)' })
  findAll(@Query() query: QueryBulletinDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un bulletin avec toutes ses lignes' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger le bulletin en PDF' })
  @ApiProduces('application/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.service.generatePdf(id, user.etablissementId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bulletin-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('generer')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Générer les bulletins d\'une classe pour une période (calcul moyennes + rangs)',
    description: 'Crée ou régénère tous les bulletins. Les bulletins déjà publiés bloquent la régénération.',
  })
  generer(@Body() dto: GenererBulletinsDto, @CurrentUser() user: JwtPayload) {
    return this.service.generer(dto, user.etablissementId);
  }

  @Patch(':id/publier')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Publier un bulletin individuel — notifie les parents, rend immuable' })
  publier(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.publier(id, user.etablissementId);
  }

  @Patch('publier-classe')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Publier tous les bulletins d\'une classe pour une période' })
  publierClasse(@Body() dto: GenererBulletinsDto, @CurrentUser() user: JwtPayload) {
    return this.service.publierClasse(dto, user.etablissementId);
  }
}
