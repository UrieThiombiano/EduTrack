import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryDto } from '../../common/dto/query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('parents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly service: ParentsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des parents' })
  findAll(@Query() query: QueryDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un parent avec ses enfants' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer un parent (utilisateur + profil en transaction)' })
  create(@Body() dto: CreateParentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un parent' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateParentDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Désactiver un parent (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
