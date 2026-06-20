import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUtilisateur(data: {
  etablissementId: number;
  roleId: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
}) {
  const hash = await bcrypt.hash(data.password, 10);
  return prisma.utilisateur.upsert({
    where: { id_etablissement_email: { id_etablissement: data.etablissementId, email: data.email } },
    update: {},
    create: {
      id_etablissement: data.etablissementId,
      id_role: data.roleId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone ?? null,
      mot_de_passe_hash: hash,
    },
  });
}

async function main() {
  console.log('\n🌱 Seeding EduTrack...\n');

  // ── 1. Rôles (incluant super_admin pour PUKRI) ────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { libelle: 'super_admin' },    update: {}, create: { libelle: 'super_admin',    description: 'PUKRI AI Systems — administration plateforme' } }),
    prisma.role.upsert({ where: { libelle: 'administration' }, update: {}, create: { libelle: 'administration', description: 'Gestion administrative établissement' } }),
    prisma.role.upsert({ where: { libelle: 'directeur' },      update: {}, create: { libelle: 'directeur',      description: "Direction de l'établissement" } }),
    prisma.role.upsert({ where: { libelle: 'enseignant' },     update: {}, create: { libelle: 'enseignant',     description: 'Corps enseignant' } }),
    prisma.role.upsert({ where: { libelle: 'parent' },         update: {}, create: { libelle: 'parent',         description: 'Parent ou tuteur légal' } }),
  ]);
  const byRole = Object.fromEntries(roles.map(r => [r.libelle, r]));
  console.log(`  ✅ ${roles.length} rôles créés (dont super_admin PUKRI)`);

  // ── 2. Établissement PUKRI (virtual, pour y rattacher le super_admin) ─────
  const pukriEtab = await prisma.etablissement.upsert({
    where: { code_etablissement: 'PUKRI-HQ' },
    update: {},
    create: {
      nom: 'PUKRI AI Systems',
      code_etablissement: 'PUKRI-HQ',
      pays: 'Burkina Faso',
      ville: 'Ouagadougou',
      type_etablissement: 'plateforme',
      email: 'admin@pukri.ai',
    },
  });

  // Super admin PUKRI
  await upsertUtilisateur({
    etablissementId: pukriEtab.id_etablissement,
    roleId: byRole.super_admin.id_role,
    nom: 'AI Systems',
    prenom: 'PUKRI',
    email: 'superadmin@pukri.ai',
    password: 'Pukri@SuperAdmin2024!',
    telephone: '+226 00 00 00 00',
  });
  console.log('  ✅ PUKRI super_admin : superadmin@pukri.ai / Pukri@SuperAdmin2024!');

  // ── 3. Établissement de démo ──────────────────────────────────────────────
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
      telephone: '+226 25 30 00 01',
    },
  });
  const etabId = etablissement.id_etablissement;
  console.log(`  ✅ Établissement : ${etablissement.nom}`);

  // ── 4. Utilisateurs de l'établissement ───────────────────────────────────

  // Administration
  await upsertUtilisateur({
    etablissementId: etabId,
    roleId: byRole.administration.id_role,
    nom: 'Kaboré',
    prenom: 'Adama',
    email: 'admin@lycee-zinda.bf',
    password: 'Admin@2024!',
    telephone: '+226 70 11 22 33',
  });
  console.log('  ✅ Administration : admin@lycee-zinda.bf / Admin@2024!');

  // Directeur
  await upsertUtilisateur({
    etablissementId: etabId,
    roleId: byRole.directeur.id_role,
    nom: 'Ouédraogo',
    prenom: 'Moussa',
    email: 'directeur@lycee-zinda.bf',
    password: 'Directeur@2024!',
    telephone: '+226 70 22 33 44',
  });
  console.log('  ✅ Directeur     : directeur@lycee-zinda.bf / Directeur@2024!');

  // Enseignant + profil
  const userEnseignant = await upsertUtilisateur({
    etablissementId: etabId,
    roleId: byRole.enseignant.id_role,
    nom: 'Traoré',
    prenom: 'Issouf',
    email: 'enseignant@lycee-zinda.bf',
    password: 'Enseign@2024!',
    telephone: '+226 70 33 44 55',
  });
  const enseignant = await prisma.enseignant.upsert({
    where: { id_utilisateur: userEnseignant.id_utilisateur },
    update: {},
    create: { id_utilisateur: userEnseignant.id_utilisateur, matricule: 'ENS-001', specialite: 'Mathématiques', grade: 'Professeur certifié' },
  });
  console.log('  ✅ Enseignant    : enseignant@lycee-zinda.bf / Enseign@2024!');

  // Parent + profil
  const userParent = await upsertUtilisateur({
    etablissementId: etabId,
    roleId: byRole.parent.id_role,
    nom: 'Sawadogo',
    prenom: 'Fatimata',
    email: 'parent@lycee-zinda.bf',
    password: 'Parent@2024!',
    telephone: '+226 70 44 55 66',
  });
  const parent = await prisma.parent.upsert({
    where: { id_utilisateur: userParent.id_utilisateur },
    update: {},
    create: { id_utilisateur: userParent.id_utilisateur, profession: 'Commerçante', adresse: 'Secteur 15, Ouagadougou' },
  });
  console.log('  ✅ Parent        : parent@lycee-zinda.bf / Parent@2024!');

  // ── 5. Elève fictif (sans compte login — créé par l'admin) ───────────────
  // On crée un utilisateur élève SANS email (pas de login possible)
  const hashEleve = await bcrypt.hash('no-login', 10);
  const userEleve = await prisma.utilisateur.upsert({
    where: { id_etablissement_email: { id_etablissement: etabId, email: 'eleve.aminata@nologin.local' } },
    update: {},
    create: {
      id_etablissement: etabId,
      id_role: (await prisma.role.upsert({ where: { libelle: 'eleve' }, update: {}, create: { libelle: 'eleve', description: 'Élève (sans accès plateforme)' } })).id_role,
      nom: 'Sawadogo',
      prenom: 'Aminata',
      email: 'eleve.aminata@nologin.local',
      mot_de_passe_hash: hashEleve,
      est_actif: false, // bloque toute connexion
    },
  });
  const eleveExisting = await prisma.eleve.findFirst({
    where: { OR: [{ id_utilisateur: userEleve.id_utilisateur }, { matricule: 'ELV-2024-001' }] },
  });
  const eleve = eleveExisting ?? await prisma.eleve.create({
    data: { id_utilisateur: userEleve.id_utilisateur, matricule: 'ELV-2024-001', date_naissance: new Date('2007-03-15'), lieu_naissance: 'Ouagadougou', sexe: 'F' },
  });
  await prisma.lienParentEleve.upsert({
    where: { id_parent_id_eleve: { id_parent: parent.id_parent, id_eleve: eleve.id_eleve } },
    update: {},
    create: { id_parent: parent.id_parent, id_eleve: eleve.id_eleve, type_lien: 'mère', est_contact_principal: true },
  });
  console.log('  ✅ Élève fictif  : Aminata Sawadogo (liée à Fatimata, sans accès)');

  // ── 6. Année + périodes ───────────────────────────────────────────────────
  const annee = await prisma.anneeScolaire.upsert({
    where: { id_etablissement_libelle: { id_etablissement: etabId, libelle: '2024-2025' } },
    update: {},
    create: { id_etablissement: etabId, libelle: '2024-2025', date_debut: new Date('2024-10-01'), date_fin: new Date('2025-07-31'), est_courante: true },
  });
  for (const t of [
    { ordre: 1, libelle: '1er Trimestre',  debut: '2024-10-01', fin: '2024-12-31' },
    { ordre: 2, libelle: '2ème Trimestre', debut: '2025-01-13', fin: '2025-03-28' },
    { ordre: 3, libelle: '3ème Trimestre', debut: '2025-04-14', fin: '2025-07-11' },
  ]) {
    const exists = await prisma.periode.findFirst({ where: { id_annee_scolaire: annee.id_annee_scolaire, numero_ordre: t.ordre } });
    if (!exists) {
      await prisma.periode.create({ data: { id_annee_scolaire: annee.id_annee_scolaire, type_periode: 'trimestre', numero_ordre: t.ordre, libelle: t.libelle, date_debut: new Date(t.debut), date_fin: new Date(t.fin) } });
    }
  }
  console.log(`  ✅ Année ${annee.libelle} + 3 trimestres`);

  // ── 7. Niveaux + matières ─────────────────────────────────────────────────
  await prisma.niveau.createMany({
    data: [
      { id_etablissement: etabId, libelle: 'Terminale C', ordre_affichage: 1, cycle: 'secondaire_2' },
      { id_etablissement: etabId, libelle: 'Terminale D', ordre_affichage: 2, cycle: 'secondaire_2' },
      { id_etablissement: etabId, libelle: 'Première C',  ordre_affichage: 3, cycle: 'secondaire_2' },
      { id_etablissement: etabId, libelle: 'Seconde A',   ordre_affichage: 4, cycle: 'secondaire_1' },
      { id_etablissement: etabId, libelle: 'Troisième',   ordre_affichage: 5, cycle: 'secondaire_1' },
    ],
    skipDuplicates: true,
  });
  const niveaux = await prisma.niveau.findMany({ where: { id_etablissement: etabId } });

  await prisma.matiere.createMany({
    data: [
      { code_matiere: 'MATH',  libelle: 'Mathématiques',                       id_etablissement: etabId },
      { code_matiere: 'PHY',   libelle: 'Physique-Chimie',                     id_etablissement: etabId },
      { code_matiere: 'SVT',   libelle: 'Sciences de la Vie et de la Terre',   id_etablissement: etabId },
      { code_matiere: 'FR',    libelle: 'Français',                            id_etablissement: etabId },
      { code_matiere: 'HG',    libelle: 'Histoire-Géographie',                 id_etablissement: etabId },
      { code_matiere: 'ANG',   libelle: 'Anglais',                             id_etablissement: etabId },
      { code_matiere: 'PHILO', libelle: 'Philosophie',                         id_etablissement: etabId },
      { code_matiere: 'EPS',   libelle: 'Éducation Physique et Sportive',      id_etablissement: etabId },
    ],
    skipDuplicates: true,
  });
  const matieres = await prisma.matiere.findMany({ where: { id_etablissement: etabId } });
  console.log(`  ✅ ${niveaux.length} niveaux, ${matieres.length} matières`);

  // ── 8. Classe TC-A + inscriptions + coefficients + attribution ────────────
  const niveauTC = niveaux.find(n => n.libelle === 'Terminale C')!;
  const classeExisting = await prisma.classe.findFirst({ where: { code_classe: 'TC-A', id_annee_scolaire: annee.id_annee_scolaire } });
  const classe = classeExisting ?? await prisma.classe.create({
    data: {
      id_annee_scolaire: annee.id_annee_scolaire,
      id_niveau: niveauTC.id_niveau,
      id_enseignant_titulaire: enseignant.id_enseignant,
      code_classe: 'TC-A',
      libelle: 'Terminale C – A',
      capacite_max: 50,
      salle_principale: 'Salle 01',
    },
  });

  await prisma.inscription.upsert({
    where: { id_eleve_id_classe: { id_eleve: eleve.id_eleve, id_classe: classe.id_classe } },
    update: {},
    create: { id_eleve: eleve.id_eleve, id_classe: classe.id_classe, statut: 'inscrit' },
  });

  const coefs: Record<string, number> = { MATH: 5, PHY: 4, SVT: 3, FR: 3, HG: 2, ANG: 2, PHILO: 2, EPS: 1 };
  for (const mat of matieres) {
    await prisma.coefficient.upsert({
      where: { id_matiere_id_niveau: { id_matiere: mat.id_matiere, id_niveau: niveauTC.id_niveau } },
      update: {},
      create: { id_matiere: mat.id_matiere, id_niveau: niveauTC.id_niveau, valeur: coefs[mat.code_matiere] ?? 2 },
    });
  }

  const mathMat = matieres.find(m => m.code_matiere === 'MATH')!;
  await prisma.attributionEnseignant.upsert({
    where: { id_enseignant_id_classe_id_matiere_id_annee_scolaire: { id_enseignant: enseignant.id_enseignant, id_classe: classe.id_classe, id_matiere: mathMat.id_matiere, id_annee_scolaire: annee.id_annee_scolaire } },
    update: {},
    create: { id_enseignant: enseignant.id_enseignant, id_classe: classe.id_classe, id_matiere: mathMat.id_matiere, id_annee_scolaire: annee.id_annee_scolaire },
  });
  console.log(`  ✅ Classe ${classe.libelle} + Aminata inscrite + attribution Maths`);

  console.log('\n🎉 Seed EduTrack terminé !\n');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  COMPTES DE DÉMONSTRATION                                    │');
  console.log('├──────────────────────┬───────────────────────────────────────┤');
  console.log('│  PUKRI super_admin   │  superadmin@pukri.ai / Pukri@SuperAdmin2024!  │');
  console.log('│  Administration      │  admin@lycee-zinda.bf / Admin@2024!           │');
  console.log('│  Directeur           │  directeur@lycee-zinda.bf / Directeur@2024!   │');
  console.log('│  Enseignant          │  enseignant@lycee-zinda.bf / Enseign@2024!    │');
  console.log('│  Parent              │  parent@lycee-zinda.bf / Parent@2024!         │');
  console.log('└──────────────────────┴───────────────────────────────────────┘\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
