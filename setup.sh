#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# PUKRI EduTrack — Script de setup local
# Usage : chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────
set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "\n${BLUE}🎓 PUKRI EduTrack — Setup local${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Prérequis
info "Vérification des prérequis..."
command -v node   >/dev/null 2>&1 || err "Node.js v20+ requis → https://nodejs.org"
command -v docker >/dev/null 2>&1 || err "Docker requis → https://docs.docker.com/get-docker/"
command -v pnpm   >/dev/null 2>&1 || { warn "pnpm non trouvé → installation..."; npm install -g pnpm; }
NODE_V=$(node -v | cut -dv -f2 | cut -d. -f1)
[ "$NODE_V" -lt 20 ] && err "Node.js v20+ requis (actuel: $(node -v))"
ok "Prérequis OK (Node $(node -v) · pnpm $(pnpm -v))"

# 2. Fichiers .env
info "Création des fichiers .env..."
[ ! -f apps/api/.env ] && cp apps/api/.env.example apps/api/.env && ok "apps/api/.env créé" || warn "apps/api/.env existe déjà"
[ ! -f apps/web/.env ] && cp apps/web/.env.example apps/web/.env && ok "apps/web/.env créé" || warn "apps/web/.env existe déjà"

# 3. Docker
info "Démarrage des services Docker..."
docker compose up -d postgres redis minio
info "Attente PostgreSQL..."
for i in {1..30}; do
  docker compose exec -T postgres pg_isready -U edutrack >/dev/null 2>&1 && break
  sleep 1; [ $i -eq 30 ] && err "PostgreSQL non disponible après 30s"
done
ok "PostgreSQL prêt"

# 4. Dépendances
info "Installation pnpm workspaces..."
pnpm install
ok "Dépendances installées"

# 5. Prisma
info "Génération du client Prisma..."
cd apps/api && pnpm exec prisma generate
ok "Client Prisma généré"
info "Migration base de données..."
pnpm exec prisma migrate dev --name init --skip-seed
ok "Tables créées"
info "Seeding données de démonstration..."
pnpm exec ts-node prisma/seed.ts
ok "Seed terminé"
cd ../..

# 6. Récap
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅  EduTrack est prêt !${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Services :"
echo "  🐘 PostgreSQL   → localhost:5432"
echo "  🔴 Redis        → localhost:6379"
echo "  🗄️  MinIO API    → http://localhost:9000"
echo "  🖥️  MinIO UI     → http://localhost:9001  (minioadmin/minioadmin)"
echo ""
echo "  Démarrer le dev :"
echo "  $ pnpm dev          ← API + Web en parallèle"
echo "  $ pnpm dev:api      ← API seule  → http://localhost:3000"
echo "  $ pnpm dev:web      ← Web seule  → http://localhost:5173"
echo "  $ pnpm prisma:studio → http://localhost:5555"
echo ""
echo "  Compte admin démo :"
echo "  📧 admin@lycee-zinda.bf"
echo "  🔑 Admin@2024!"
echo ""
