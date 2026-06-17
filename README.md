# 🎓 PUKRI EduTrack

> Plateforme SaaS de suivi scolaire multi-tenant pour établissements africains.
> Développé par **PUKRI AI Systems** · Ouagadougou, Burkina Faso

## Stack

| | |
|---|---|
| Backend | NestJS 10 + Prisma 5 + PostgreSQL 16 |
| Frontend | React 18 + Vite 5 + Tailwind CSS + PWA |
| Cache | Redis 7 |
| Stockage | MinIO |
| IA Premium | Anthropic API (claude-sonnet-4-5) |

## Démarrage rapide

```bash
# 1. Cloner & setup (une seule fois)
git clone <repo> edutrack && cd edutrack
chmod +x setup.sh && ./setup.sh

# 2. Dev quotidien
docker compose up -d   # Infrastructure
pnpm dev               # API :3000 + Web :5173

# 3. Swagger
open http://localhost:3000/api/docs

# 4. Prisma Studio
pnpm prisma:studio     # http://localhost:5555
```

## Structure

```
apps/api/    ← NestJS + Prisma
apps/web/    ← React + Vite
packages/    ← Types partagés
```

Voir **CLAUDE.md** pour le contexte complet du projet.
"# EduTrack" 
