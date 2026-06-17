import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TypesEvaluationService } from './types-evaluation.service';
import { CreateTypeEvaluationDto } from './dto/create-type-evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('types-evaluation')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('types-evaluation')
export class TypesEvaluationController {
  constructor(private readonly service: TypesEvaluationService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des types d\'évaluation' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.etablissementId);
  }

  @Post()
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer un type d\'évaluation' })
  create(@Body() dto: CreateTypeEvaluationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.etablissementId);
  }

  @Patch(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Modifier un type d\'évaluation' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTypeEvaluationDto>, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.etablissementId);
  }

  @Delete(':id')
  @Roles('administration', 'directeur')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Désactiver un type d\'évaluation' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.etablissementId);
  }
}
