import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Seeding EduTrack...\n');

  // ── Rôles système
  const roles = await Promise.all([
    prisma.role.upsert({ where: { libelle: 'administration' }, update: {}, create: { libelle: 'administration', description: 'Gestion administrative complète' } }),
    prisma.role.upsert({ where: { libelle: 'directeur' },     update: {}, create: { libelle: 'directeur',     description: "Direction de l'établissement" } }),
    prisma.role.upsert({ where: { libelle: 'enseignant' },    update: {}, create: { libelle: 'enseignant',    description: 'Corps enseignant' } }),
    prisma.role.upsert({ where: { libelle: 'parent' },        update: {}, create: { libelle: 'parent',        description: 'Parent ou tuteur légal' } }),
    prisma.role.upsert({ where: { libelle: 'eleve' },         update: {}, create: { libelle: 'eleve',         description: 'Élève inscrit' } }),
  ]);
  console.log(`  ✅ ${roles.length} rôles créés`);

  // ── Établissement de démo
  const etablissement = await prisma.etablissement.upsert({
    where: { code_etablissement: 'LYC-OUAGA-001' },
    update: {},
    create: {
      nom: 'Lycée Zinda de Ouagadougou',
      code_etablissement: 'LYC-OUAGA-001',
      pays: 'Burkina Faso',
      ville: 'Ouagadougou',
      type_etablissement: 'secondaire',
      email: 'contact@lycee-zinda.bf',
    },
  });
  console.log(`  ✅ Établissement : ${etablissement.nom}`);

  // ── Utilisateur admin
  const roleAdmin = roles.find(r => r.libelle === 'administration')!;
  const hash = await bcrypt.hash('Admin@2024!', 10);
  await prisma.utilisateur.upsert({
    where: { email: 'admin@lycee-zinda.bf' },
    update: {},
    create: {
      id_etablissement: etablissement.id_etablissement,
      id_role: roleAdmin.id_role,
      nom: 'Administrateur',
      prenom: 'EduTrack',
      email: 'admin@lycee-zinda.bf',
      mot_de_passe_hash: hash,
    },
  });
  console.log('  ✅ Admin : admin@lycee-zinda.bf / Admin@2024!');

  // ── Année scolaire courante
  const annee = await prisma.anneeScolaire.upsert({
    where: { id_etablissement_libelle: { id_etablissement: etablissement.id_etablissement, libelle: '2024-2025' } },
    update: {},
    create: {
      id_etablissement: etablissement.id_etablissement,
      libelle: '2024-2025',
      date_debut: new Date('2024-10-01'),
      date_fin: new Date('2025-07-31'),
      est_courante: true,
    },
  });
  console.log(`  ✅ Année scolaire : ${annee.libelle}`);

  // ── 3 trimestres (insert or ignore pattern)
  for (const t of [
    { ordre: 1, libelle: '1er Trimestre',  debut: '2024-10-01', fin: '2024-12-31' },
    { ordre: 2, libelle: '2ème Trimestre', debut: '2025-01-13', fin: '2025-03-28' },
    { ordre: 3, libelle: '3ème Trimestre', debut: '2025-04-14', fin: '2025-07-11' },
  ]) {
    const exists = await prisma.periode.findFirst({
      where: { id_annee_scolaire: annee.id_annee_scolaire, numero_ordre: t.ordre },
    });
    if (!exists) {
      await prisma.periode.create({
        data: {
          id_annee_scolaire: annee.id_annee_scolaire,
          type_periode: 'trimestre',
          numero_ordre: t.ordre,
          libelle: t.libelle,
          date_debut: new Date(t.debut),
          date_fin: new Date(t.fin),
        },
      });
    }
  }
  console.log('  ✅ 3 trimestres créés');

  // ── Niveaux (createMany + skipDuplicates pour idempotence)
  await prisma.niveau.createMany({
    data: [
      { id_etablissement: etablissement.id_etablissement, libelle: 'Terminale C', ordre_affichage: 1, cycle: 'secondaire_2' },
      { id_etablissement: etablissement.id_etablissement, libelle: 'Terminale D', ordre_affichage: 2, cycle: 'secondaire_2' },
      { id_etablissement: etablissement.id_etablissement, libelle: 'Première C',  ordre_affichage: 3, cycle: 'secondaire_2' },
      { id_etablissement: etablissement.id_etablissement, libelle: 'Seconde A',   ordre_affichage: 4, cycle: 'secondaire_1' },
      { id_etablissement: etablissement.id_etablissement, libelle: 'Troisième',   ordre_affichage: 5, cycle: 'secondaire_1' },
    ],
    skipDuplicates: true,
  });
  const niveauxCreated = await prisma.niveau.findMany({ where: { id_etablissement: etablissement.id_etablissement } });
  console.log(`  ✅ ${niveauxCreated.length} niveaux créés`);

  console.log('\n🎉 Seed EduTrack terminé !');
  console.log('  → URL : http://localhost:3000/api/v1');
  console.log('  → Docs : http://localhost:3000/api/docs\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
