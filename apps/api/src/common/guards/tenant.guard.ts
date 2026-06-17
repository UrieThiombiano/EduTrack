import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * Vérifie que la ressource demandée (via :id) appartient bien à l'établissement
 * du token JWT. À utiliser sur les routes qui exposent une ressource sensible par ID.
 *
 * Usage : @UseGuards(JwtAuthGuard, TenantGuard)
 * Le controller doit avoir un paramètre :id dans l'URL.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload; params: Record<string, string> }>();
    const { user, params } = req;

    if (!user?.etablissementId) throw new ForbiddenException('Établissement non identifié');

    const id = params?.id ? parseInt(params.id, 10) : undefined;
    if (!id) return true; // pas d'ID → la vérification se fait dans le service

    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: { id_utilisateur: id, id_etablissement: user.etablissementId },
      select: { id_utilisateur: true },
    });

    if (!utilisateur) throw new NotFoundException(`Ressource #${id} introuvable dans votre établissement`);
    return true;
  }
}
