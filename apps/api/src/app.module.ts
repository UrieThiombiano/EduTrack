import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { EtablissementsModule } from './modules/etablissements/etablissements.module';
import { UtilisateursModule } from './modules/utilisateurs/utilisateurs.module';
import { AnneesScolairesModule } from './modules/annees-scolaires/annees-scolaires.module';
import { PeriodesModule } from './modules/periodes/periodes.module';
import { NiveauxModule } from './modules/niveaux/niveaux.module';
import { MatieresModule } from './modules/matieres/matieres.module';
import { CoefficientsModule } from './modules/coefficients/coefficients.module';
import { ClassesModule } from './modules/classes/classes.module';
import { EnseignantsModule } from './modules/enseignants/enseignants.module';
import { ElevesModule } from './modules/eleves/eleves.module';
import { ParentsModule } from './modules/parents/parents.module';
import { LienParentEleveModule } from './modules/lien-parent-eleve/lien-parent-eleve.module';
import { InscriptionsModule } from './modules/inscriptions/inscriptions.module';
import { AttributionsModule } from './modules/attributions/attributions.module';
import { EmploisDuTempsModule } from './modules/emplois-du-temps/emplois-du-temps.module';
import { TypesEvaluationModule } from './modules/types-evaluation/types-evaluation.module';
import { PeriodesEvaluationModule } from './modules/periodes-evaluation/periodes-evaluation.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { NotesModule } from './modules/notes/notes.module';
import { AbsencesModule } from './modules/absences/absences.module';
import { SanctionsModule } from './modules/sanctions/sanctions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BulletinsModule } from './modules/bulletins/bulletins.module';
import { RapportsIaModule } from './modules/rapports-ia/rapports-ia.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { EspaceParentModule } from './modules/espace-parent/espace-parent.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    // ── Infrastructure ──────────────────────────────────────────
    PrismaModule,
    RedisModule,
    // ── Auth ────────────────────────────────────────────────────
    AuthModule,
    // ── Phase 2 : Structure Académique ─────────────────────────
    EtablissementsModule,
    UtilisateursModule,
    AnneesScolairesModule,
    PeriodesModule,
    NiveauxModule,
    MatieresModule,
    CoefficientsModule,
    ClassesModule,
    EnseignantsModule,
    ElevesModule,
    ParentsModule,
    LienParentEleveModule,
    // ── Phase 3 : Pédagogie ─────────────────────────────────────
    InscriptionsModule,
    AttributionsModule,
    EmploisDuTempsModule,
    TypesEvaluationModule,
    PeriodesEvaluationModule,
    EvaluationsModule,
    NotesModule,
    // ── Phase 4 : Vie scolaire & Bulletins ──────────────────────
    AbsencesModule,
    SanctionsModule,
    NotificationsModule,
    BulletinsModule,
    RapportsIaModule,
    // ── PUKRI & Espaces dédiés ───────────────────────────────────
    SuperAdminModule,
    EspaceParentModule,
  ],
})
export class AppModule {}
