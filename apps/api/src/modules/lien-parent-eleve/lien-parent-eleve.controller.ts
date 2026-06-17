import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LienParentEleveService } from './lien-parent-eleve.service';
import { CreateLienParentEleveDto } from './dto/create-lien.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('lien-parent-eleve')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('lien-parent-eleve')
export class LienParentEleveController {
  constructor(private readonly service: LienParentEleveService) {}

  @Get('eleve/:eleveId')
  @ApiOperation({ summary: 'Parents d\'un élève' })
  findByEleve(@Param('eleveId', ParseIntPipe) eleveId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByEleve(eleveId, user.etablissementId);
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Enfants d\'un parent' })
  findByParent(@Param('parentId', ParseIntPipe) parentId: number, @CurrentUser() user: JwtPayload) {
    return this.service.findByParent(parentId, user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lier un parent à un élève' })
  create(@Body() dto: CreateLienParentEleveDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un lien (type, contact principal)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateLienParentEleveDto>, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer un lien parent-élève' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
