# PUKRI EduTrack — Claude Code Context

> Fichier de contexte à charger automatiquement par Claude Code à chaque session.
> Maintenu par : PUKRI AI Systems · Urie Thiombiano

---

## 🎯 Vue d'ensemble du projet

**EduTrack** est une plateforme SaaS de suivi scolaire multi-tenant pour établissements africains (cible initiale : Burkina Faso). Elle couvre l'intégralité du cycle de vie d'un établissement scolaire secondaire.

**Acteurs système :**
| Rôle (DB) | Description | Accès |
|---|---|---|
| `administration` | Gestionnaire admin | Tout sauf pédagogie directe |
| `directeur` | Direction | Lecture complète + validation bulletins |
| `enseignant` | Corps enseignant | Ses classes, notes, absences |
| `parent` | Parent/tuteur | Ses enfants uniquement (lecture) |
| `eleve` | Élève inscrit | Ses propres données (lecture) |

**Modules métier :**
Inscriptions · Classes · Matières · Emplois du temps · Évaluations · Notes · Absences · Sanctions · Notifications · Bulletins · IA Premium (Anthropic)

---

## 🏗️ Architecture globale

```
edutrack/                       ← Monorepo pnpm workspaces
├── apps/
│   ├── api/                    ← NestJS + Prisma + PostgreSQL
│   └── web/                    ← React 18 + Vite 5 + PWA
└── packages/
    └── types/                  ← Types TypeScript partagés
```

### Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Backend framework | NestJS | ^10 |
| ORM | Prisma | ^5 |
| Base de données | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Stockage fichiers | MinIO | latest |
| Auth | Passport JWT | — |
| Frontend | React + Vite | 18 / 5 |
| Styling | Tailwind CSS + shadcn/ui | ^3 |
| State | Zustand + TanStack Query | — |
| Validation | Zod + class-validator | — |
| Containerisation | Docker Compose | — |

---

## 🗄️ Architecture base de données

**26 tables PostgreSQL normalisées (3NF)** organisées en 8 domaines.
Le schéma Prisma complet est dans `apps/api/prisma/schema.prisma`.
Le DBML de référence est à la racine : `edutrack_schema.dbml`.

### Les 9 domaines

| # | Domaine | Tables |
|---|---|---|
| 1 | **Identité & Sécurité** | `etablissement`, `role`, `utilisateur` |
| 2 | **Acteurs** | `enseignant`, `eleve`, `parent`, `lien_parent_eleve` |
| 3 | **Structure Académique** | `annee_scolaire`, `periode`, `niveau`, `classe`, `matiere`, `coefficient` |
| 4 | **Pédagogie** | `inscription`, `attribution_enseignant`, `emploi_du_temps` |
| 5 | **Évaluations & Notes** | `type_evaluation`, `periode_evaluation`, `evaluation`, `note` |
| 6 | **Vie Scolaire** | `absence`, `sanction` |
| 7 | **Communication** | `notification` |
| 8 | **Bulletins & IA** | `bulletin`, `ligne_bulletin`, `rapport_ia` |

### Table pivot centrale ⭐

`attribution_enseignant` **(enseignant × classe × matière × année)** est la clé de voûte du système. Elle est référencée par `emploi_du_temps` et `evaluation`. Avant de créer l'un ou l'autre, vérifier que l'attribution existe.

### Multi-tenancy (CRITIQUE)

- Toutes les données sont isolées par `id_etablissement`
- L'`etablissementId` est **extrait du JWT**, jamais passé dans l'URL
- **Toutes les requêtes Prisma doivent inclure** `where: { id_etablissement: user.etablissementId }`
- Le service guard `TenantGuard` vérifie l'appartenance de la ressource

### Pattern d'héritage utilisateur (Table-Per-Type)

```
utilisateur (compte de base, auth)
    ├── 1:1 enseignant   (profil enseignant)
    ├── 1:1 eleve        (profil élève)
    └── 1:1 parent       (profil parent)
```
Toujours créer `utilisateur` PUIS le profil spécialisé dans une transaction.

### Cardinalités clés

```
etablissement   1 ──── N utilisateur
utilisateur     1 ──── 1 enseignant | eleve | parent
annee_scolaire  1 ──── N periode
annee_scolaire  1 ──── N classe
niveau          N ──── M matiere           (via coefficient — porte la valeur)
enseignant      N ──── M (classe × matiere)(via attribution_enseignant — pivot central)
eleve           N ──── M classe            (via inscription)
attribution     1 ──── N evaluation
evaluation      1 ──── N note
periode         1 ──── N bulletin
bulletin        1 ──── N ligne_bulletin
```

---

## 📁 Structure NestJS (apps/api/src/)

```
src/
├── main.ts                         ← Bootstrap, Swagger, CORS, pipes globaux
├── app.module.ts                   ← Imports de tous les modules
├── prisma/
│   ├── prisma.module.ts            ← Module global
│   └── prisma.service.ts           ← PrismaClient étendu
├── config/
│   ├── configuration.ts            ← Config typée depuis process.env
│   └── validation.schema.ts        ← Joi/Zod validation des env vars
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   ← @CurrentUser()
│   │   ├── roles.decorator.ts          ← @Roles('enseignant', 'admin')
│   │   └── etablissement.decorator.ts  ← @EtablissementId()
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       ← JwtAuthGuard (global)
│   │   ├── roles.guard.ts          ← RolesGuard
│   │   └── tenant.guard.ts         ← Vérification appartenance établissement
│   ├── interceptors/
│   │   ├── transform.interceptor.ts    ← Enveloppe les réponses { data, meta }
│   │   └── logging.interceptor.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts   ← Gestion globale des erreurs
│   ├── pipes/
│   │   └── parse-int.pipe.ts
│   └── types/
│       └── request-with-user.ts   ← Interface RequestWithUser
└── modules/
    ├── auth/                       ← Login, refresh token, JWT strategy
    ├── etablissements/             ← CRUD établissements (super-admin)
    ├── utilisateurs/               ← CRUD utilisateurs
    ├── enseignants/
    ├── eleves/
    ├── parents/
    ├── annees-scolaires/
    ├── periodes/
    ├── niveaux/
    ├── classes/
    ├── matieres/
    ├── coefficients/
    ├── inscriptions/
    ├── attributions/               ← attribution_enseignant
    ├── emplois-du-temps/
    ├── evaluations/
    ├── notes/
    ├── absences/
    ├── sanctions/
    ├── notifications/
    ├── bulletins/                  ← Génération PDF + publication
    └── rapports-ia/               ← Appels Anthropic API
```

### Convention de module NestJS

Chaque module suit ce pattern strict :
```
{module}/
├── {module}.module.ts
├── {module}.controller.ts           ← Routes, @ApiTags, @ApiBearerAuth
├── {module}.service.ts              ← Logique métier, Prisma queries
├── dto/
│   ├── create-{module}.dto.ts       ← class-validator decorators
│   ├── update-{module}.dto.ts       ← PartialType(Create...)
│   └── query-{module}.dto.ts        ← Pagination, filtres
└── entities/
    └── {module}.entity.ts           ← Type miroir du modèle Prisma
```

### Pattern service standard

```typescript
// Toujours filtrer par etablissementId
async findAll(etablissementId: number, query: QueryDto) {
  return this.prisma.eleve.findMany({
    where: {
      utilisateur: { id_etablissement: etablissementId },
      est_actif: true,
      ...(query.search && {
        utilisateur: { nom: { contains: query.search, mode: 'insensitive' } }
      }),
    },
    include: { utilisateur: { select: { nom: true, prenom: true, email: true } } },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
}
```

---

## 📁 Structure React (apps/web/src/)

```
src/
├── main.tsx
├── App.tsx                         ← QueryClientProvider, BrowserRouter, Toaster
├── router/
│   └── index.tsx                   ← Routes avec ProtectedRoute HOC
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── eleves/
│   │   ├── ElevesListPage.tsx
│   │   └── EleveDetailPage.tsx
│   ├── classes/
│   ├── evaluations/
│   ├── notes/
│   ├── absences/
│   ├── bulletins/
│   └── settings/
├── components/
│   ├── ui/                         ← shadcn/ui (Button, Input, Table, etc.)
│   ├── layout/
│   │   ├── AppLayout.tsx           ← Sidebar + Header + Outlet
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── forms/                      ← Formulaires métier réutilisables
│   └── tables/
│       └── DataTable.tsx           ← Table générique avec pagination
├── hooks/
│   ├── useAuth.ts                  ← Accès store auth + helpers
│   └── useEtablissement.ts
├── services/
│   └── api/
│       ├── client.ts               ← Axios instance + interceptors JWT
│       ├── auth.service.ts
│       ├── eleves.service.ts
│       └── ...                     ← Un fichier par domaine
├── store/
│   ├── auth.store.ts               ← Zustand : user, tokens, setUser, logout
│   └── ui.store.ts                 ← Zustand : sidebar, loading, theme
├── types/
│   └── index.ts                    ← Types dérivés du schéma (partiellement)
└── lib/
    ├── utils.ts                    ← cn(), formatDate(), formatMontant()
    └── validators/
        └── index.ts                ← Schémas Zod partagés
```

### Pattern Axios client

```typescript
// services/api/client.ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(null, async error => {
  if (error.response?.status === 401) {
    // Refresh token flow
    await useAuthStore.getState().refreshTokens();
    return client(error.config);
  }
  return Promise.reject(error);
});
```

---

## 🌐 Conventions API REST

### Préfixe global : `/api/v1`

### Auth
```
POST  /api/v1/auth/login          { email, password } → { accessToken, refreshToken, user }
POST  /api/v1/auth/refresh        { refreshToken }    → { accessToken }
POST  /api/v1/auth/logout
GET   /api/v1/auth/me             → profil complet utilisateur courant
```

### CRUD standard
```
GET    /api/v1/{resource}          → liste paginée
GET    /api/v1/{resource}/:id      → détail
POST   /api/v1/{resource}          → création
PATCH  /api/v1/{resource}/:id      → mise à jour partielle
DELETE /api/v1/{resource}/:id      → suppression (soft ou hard selon métier)
```

### Réponse paginée standard
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 145, "totalPages": 8 }
}
```

### Erreurs standard
```json
{ "statusCode": 400, "message": "Validation failed", "errors": [...] }
{ "statusCode": 401, "message": "Unauthorized" }
{ "statusCode": 403, "message": "Forbidden resource" }
{ "statusCode": 404, "message": "Eleve #42 introuvable" }
```

---

## 📋 Conventions de nommage

| Contexte | Convention | Exemple |
|---|---|---|
| Tables PostgreSQL | snake_case | `annee_scolaire`, `lien_parent_eleve` |
| Colonnes PostgreSQL | snake_case | `id_etablissement`, `date_creation` |
| Modèles Prisma | PascalCase | `AnneeScolaire`, `LienParentEleve` |
| Champs Prisma | snake_case (= DB) | `id_etablissement`, `est_actif` |
| Variables TypeScript | camelCase | `etablissementId`, `anneeScolaireId` |
| Fichiers NestJS | kebab-case | `annees-scolaires.service.ts` |
| Classes NestJS | PascalCase | `AnneeScolairesService` |
| Routes API | kebab-case | `/api/v1/annees-scolaires` |
| Variables d'env | SCREAMING_SNAKE | `DATABASE_URL`, `JWT_SECRET` |
| Composants React | PascalCase | `EleveDetailPage.tsx` |
| Hooks React | camelCase + use | `useAuth.ts`, `useEleves.ts` |

---

## ⚠️ Règles métier importantes (à ne pas violer)

1. **Multi-tenant strict** : chaque requête Prisma doit filtrer par `id_etablissement`. Ne jamais exposer de données cross-tenant.

2. **Unicité bulletin** : `UNIQUE(id_eleve, id_periode)`. Vérifier en service avant INSERT.

3. **Note absente** : `valeur_note` peut être NULL UNIQUEMENT si `est_absent = true`. Valider en DTO et en service.

4. **Attribution requise** : avant de créer une `evaluation` ou un `emploi_du_temps`, vérifier que l'`attribution_enseignant` correspondante existe et est active.

5. **Coefficient dénormalisé** : dans `ligne_bulletin`, le champ `coefficient` est une copie historique. Ne jamais la modifier après publication (`est_publie = true`).

6. **Soft delete** : les tables avec `est_actif` n'utilisent JAMAIS `DELETE`. Setter `est_actif = false`. Exception : migrations de données.

7. **Année courante unique** : une seule `annee_scolaire` par établissement peut avoir `est_courante = true`. Utiliser une transaction pour changer d'année.

8. **Notification auto** : créer une `notification` après chaque : absence déclarée, note publiée, bulletin publié. Le canal par défaut est `in_app`.

9. **Transactions** : utiliser `prisma.$transaction([...])` pour les opérations composées (création utilisateur + profil, génération bulletin complet, changement d'année scolaire).

10. **Mot de passe** : toujours hasher avec bcryptjs (10 rounds). Ne jamais logger ni retourner `mot_de_passe_hash` dans les réponses API.

---

## 🔐 Auth & JWT

### Payload JWT
```typescript
interface JwtPayload {
  sub: number;            // id_utilisateur
  email: string;
  role: string;           // libelle du rôle
  etablissementId: number;
  iat: number;
  exp: number;
}
```

### Décorateur @CurrentUser
```typescript
// Donne accès au user depuis n'importe quel controller
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: JwtPayload) {
  return this.utilisateursService.findOne(user.sub);
}
```

### Décorateur @Roles
```typescript
@Post()
@Roles('administration', 'directeur')
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() dto: CreateEleveDto, @CurrentUser() user: JwtPayload) { ... }
```

---

## 🐳 Infrastructure locale (Docker Compose)

| Service | Port | URL / Identifiants |
|---|---|---|
| PostgreSQL | 5432 | `postgresql://edutrack:edutrack@localhost:5432/edutrack` |
| Redis | 6379 | `redis://localhost:6379` |
| MinIO API | 9000 | `minioadmin / minioadmin` |
| MinIO Console | 9001 | http://localhost:9001 |
| PgAdmin | 5050 | http://localhost:5050 · `admin@local.dev / admin` |

```bash
# Démarrer (sans pgadmin)
docker compose up -d

# Avec pgadmin
docker compose --profile tools up -d
```

---

## ⚙️ Variables d'environnement

### apps/api/.env (critique)
```env
DATABASE_URL=postgresql://edutrack:edutrack@localhost:5432/edutrack
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

### apps/web/.env
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=EduTrack
VITE_APP_ENV=development
```

---

## 🚀 Commandes de développement

```bash
# Setup initial (une seule fois)
chmod +x setup.sh && ./setup.sh

# Dev quotidien
docker compose up -d          # Démarrer PostgreSQL + Redis + MinIO
pnpm dev                      # API (port 3000) + Web (port 5173) en parallèle
pnpm dev:api                  # API seule
pnpm dev:web                  # Web seule

# Prisma
pnpm prisma:generate          # Régénérer le client après modif schema.prisma
pnpm prisma:migrate           # Nouvelle migration
pnpm prisma:studio            # Interface visuelle → http://localhost:5555
pnpm prisma:seed              # Données de démonstration

# Tests
pnpm test                     # Unit tests (jest)
pnpm --filter @edutrack/api test:e2e    # E2E tests

# Build production
pnpm build
```

---

## 📦 Prisma — Patterns courants

### Création utilisateur + profil (transaction obligatoire)
```typescript
async createEleve(dto: CreateEleveDto, etablissementId: number) {
  return this.prisma.$transaction(async (tx) => {
    const hash = await bcrypt.hash(dto.password, 10);
    const utilisateur = await tx.utilisateur.create({
      data: {
        id_etablissement: etablissementId,
        id_role: ROLES.ELEVE_ID,
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        mot_de_passe_hash: hash,
      },
    });
    const eleve = await tx.eleve.create({
      data: {
        id_utilisateur: utilisateur.id_utilisateur,
        matricule: dto.matricule,
        date_naissance: dto.dateNaissance,
        sexe: dto.sexe,
      },
    });
    return { ...eleve, utilisateur };
  });
}
```

### Query avec pagination
```typescript
const [data, total] = await Promise.all([
  this.prisma.eleve.findMany({ where, skip, take, include, orderBy }),
  this.prisma.eleve.count({ where }),
]);
return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
```

### Soft delete
```typescript
// Ne pas utiliser prisma.delete() — utiliser est_actif
await this.prisma.eleve.update({
  where: { id_eleve: id },
  data: { est_actif: false },
});
```

---

## 🤖 Module IA Premium (rapport_ia)

Utilise l'API Anthropic (claude-sonnet-4-5) pour générer des rapports d'analyse de trajectoire scolaire. Paramètres clés :

- `score_risque` : 0-100, calculé à partir des notes, absences, tendance
- `niveau_risque` : `faible` / `moyen` / `eleve` / `critique`
- `forces`, `faiblesses`, `recommandations` : JSONB → Array<string>

Le prompt de génération est dans `modules/rapports-ia/prompts/rapport.prompt.ts`. Ne pas modifier sans validation.

---

## 🧪 Tests

```
apps/api/
├── src/**/*.spec.ts        ← Tests unitaires (un par service)
└── test/
    └── *.e2e-spec.ts       ← Tests e2e (supertest + Jest)
```

**Convention** : chaque service a son `.spec.ts`. Les controllers sont testés via e2e uniquement.

---

## 🗂️ Fichiers de référence importants

| Fichier | Rôle |
|---|---|
| `edutrack_schema.dbml` | Schéma complet avec cardinalités (source de vérité DB) |
| `apps/api/prisma/schema.prisma` | Modèles Prisma (source de vérité TS) |
| `apps/api/src/prisma/prisma.service.ts` | PrismaService injecté partout |
| `apps/api/src/common/guards/jwt-auth.guard.ts` | Auth guard global |
| `apps/api/src/common/decorators/current-user.decorator.ts` | @CurrentUser() |
| `apps/web/src/services/api/client.ts` | Axios + interceptors JWT |
| `apps/web/src/store/auth.store.ts` | État authentification global |
| `docker-compose.yml` | Infrastructure locale |
| `setup.sh` | Script de setup initial |

---

## 🔴 Points d'attention pour Claude Code

- Ne jamais retourner `mot_de_passe_hash` dans les réponses API
- Toujours inclure `id_etablissement` dans les `where` Prisma (multi-tenancy)
- Utiliser `$transaction` pour toute opération composée sur plusieurs tables
- Le schéma Prisma fait foi — ne pas créer de colonnes sans modifier `schema.prisma` ET créer une migration
- Les bulletins publiés (`est_publie = true`) sont immuables
- Un seul `@Global()` module : PrismaModule. Les autres injectent PrismaService via leur propre module
- Préférer `PATCH` à `PUT` pour les mises à jour partielles
- Valider les DTOs avec `class-validator` + définir également les schémas Zod côté frontend
