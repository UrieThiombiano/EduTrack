import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ElevesService } from './eleves.service';
import { CreateEleveDto } from './dto/create-eleve.dto';
import { UpdateEleveDto } from './dto/update-eleve.dto';
import { QueryEleveDto } from './dto/query-eleve.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('eleves')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('eleves')
export class ElevesController {
  constructor(private readonly service: ElevesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des élèves (filtrable par classe, année, sexe)' })
  findAll(@Query() query: QueryEleveDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un élève avec inscriptions et parents' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Inscrire un élève (utilisateur + profil en transaction)' })
  create(@Body() dto: CreateEleveDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un élève' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEleveDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Désactiver un élève (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
