import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const REFRESH_PREFIX = 'refresh_token:';
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7; // 7 jours

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(dto: LoginDto) {
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: { email: dto.email, est_actif: true },
      include: { role: { select: { libelle: true } } },
    });

    if (!utilisateur) throw new UnauthorizedException('Identifiants incorrects');

    const passwordValid = await bcrypt.compare(dto.password, utilisateur.mot_de_passe_hash);
    if (!passwordValid) throw new UnauthorizedException('Identifiants incorrects');

    await this.prisma.utilisateur.update({
      where: { id_utilisateur: utilisateur.id_utilisateur },
      data: { derniere_connexion: new Date() },
    });

    const payload: JwtPayload = {
      sub: utilisateur.id_utilisateur,
      email: utilisateur.email ?? '',
      role: utilisateur.role.libelle,
      etablissementId: utilisateur.id_etablissement,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: utilisateur.id_utilisateur,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role.libelle,
        etablissementId: utilisateur.id_etablissement,
        photoUrl: utilisateur.photo_url,
      },
    };
  }

  async refresh(userId: number, refreshToken: string) {
    const storedToken = await this.redis.get(`${REFRESH_PREFIX}${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: { id_utilisateur: userId, est_actif: true },
      include: { role: { select: { libelle: true } } },
    });

    if (!utilisateur) throw new UnauthorizedException('Utilisateur introuvable');

    const payload: JwtPayload = {
      sub: utilisateur.id_utilisateur,
      email: utilisateur.email ?? '',
      role: utilisateur.role.libelle,
      etablissementId: utilisateur.id_etablissement,
    };

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(payload);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.redis.del(`${REFRESH_PREFIX}${userId}`);
  }

  async getMe(userId: number) {
    const utilisateur = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id_utilisateur: userId },
      include: { role: { select: { libelle: true } } },
    });

    const { mot_de_passe_hash: _, ...rest } = utilisateur;
    return { ...rest, role: utilisateur.role.libelle };
  }

  // ── Private ──────────────────────────────────────────────────

  private async generateTokens(payload: JwtPayload) {
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn', '15m'),
      }),
      this.jwt.signAsync({ ...payload, jti }, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn', '7d'),
      }),
    ]);

    await this.redis.set(`${REFRESH_PREFIX}${payload.sub}`, refreshToken, REFRESH_TTL_SEC);
    return { accessToken, refreshToken };
  }
}
