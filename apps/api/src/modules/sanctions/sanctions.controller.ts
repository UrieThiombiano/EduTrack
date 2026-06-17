import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SanctionsService } from './sanctions.service';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import { QuerySanctionDto } from './dto/query-sanction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('sanctions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('sanctions')
export class SanctionsController {
  constructor(private readonly service: SanctionsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des sanctions filtrée par élève / classe / type' })
  findAll(@Query() query: QuerySanctionDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une sanction' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une sanction' })
  create(@Body() dto: CreateSanctionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier une sanction' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSanctionDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer une sanction' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
