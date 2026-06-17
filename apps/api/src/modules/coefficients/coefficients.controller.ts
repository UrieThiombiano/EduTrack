import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoefficientsService } from './coefficients.service';
import { CreateCoefficientDto } from './dto/create-coefficient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('coefficients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('coefficients')
export class CoefficientsController {
  constructor(private readonly service: CoefficientsService) {}

  @Get('niveau/:niveauId')
  @ApiOperation({ summary: 'Coefficients d\'un niveau' })
  findByNiveau(@Param('niveauId', ParseIntPipe) niveauId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByNiveau(niveauId, user.etablissementId);
  }

  @Get('matiere/:matiereId')
  @ApiOperation({ summary: 'Coefficients d\'une matière (tous niveaux)' })
  findByMatiere(@Param('matiereId', ParseIntPipe) matiereId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByMatiere(matiereId, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer ou mettre à jour un coefficient (upsert)' })
  upsert(@Body() dto: CreateCoefficientDto, @CurrentUser() user: JwtPayload) {
    return this.service.upsert(dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer un coefficient' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
