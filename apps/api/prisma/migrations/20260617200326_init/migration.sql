-- CreateTable
CREATE TABLE "etablissement" (
    "id_etablissement" SERIAL NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "code_etablissement" VARCHAR(50) NOT NULL,
    "adresse" TEXT,
    "telephone" VARCHAR(20),
    "email" VARCHAR(150),
    "logo_url" VARCHAR(500),
    "type_etablissement" VARCHAR(50),
    "pays" VARCHAR(100) NOT NULL DEFAULT 'Burkina Faso',
    "ville" VARCHAR(100),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etablissement_pkey" PRIMARY KEY ("id_etablissement")
);

-- CreateTable
CREATE TABLE "role" (
    "id_role" SERIAL NOT NULL,
    "libelle" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "utilisateur" (
    "id_utilisateur" SERIAL NOT NULL,
    "id_etablissement" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150),
    "telephone" VARCHAR(20),
    "mot_de_passe_hash" VARCHAR(255) NOT NULL,
    "photo_url" VARCHAR(500),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "derniere_connexion" TIMESTAMP(3),
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id_utilisateur")
);

-- CreateTable
CREATE TABLE "enseignant" (
    "id_enseignant" SERIAL NOT NULL,
    "id_utilisateur" INTEGER NOT NULL,
    "matricule" VARCHAR(50) NOT NULL,
    "specialite" VARCHAR(150),
    "grade" VARCHAR(100),
    "date_prise_de_fonction" DATE,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enseignant_pkey" PRIMARY KEY ("id_enseignant")
);

-- CreateTable
CREATE TABLE "eleve" (
    "id_eleve" SERIAL NOT NULL,
    "id_utilisateur" INTEGER NOT NULL,
    "matricule" VARCHAR(50) NOT NULL,
    "date_naissance" DATE,
    "lieu_naissance" VARCHAR(150),
    "sexe" CHAR(1),
    "numero_extrait_naissance" VARCHAR(100),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "eleve_pkey" PRIMARY KEY ("id_eleve")
);

-- CreateTable
CREATE TABLE "parent" (
    "id_parent" SERIAL NOT NULL,
    "id_utilisateur" INTEGER NOT NULL,
    "profession" VARCHAR(150),
    "adresse" TEXT,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parent_pkey" PRIMARY KEY ("id_parent")
);

-- CreateTable
CREATE TABLE "lien_parent_eleve" (
    "id_lien" SERIAL NOT NULL,
    "id_parent" INTEGER NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "type_lien" VARCHAR(50),
    "est_contact_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lien_parent_eleve_pkey" PRIMARY KEY ("id_lien")
);

-- CreateTable
CREATE TABLE "annee_scolaire" (
    "id_annee_scolaire" SERIAL NOT NULL,
    "id_etablissement" INTEGER NOT NULL,
    "libelle" VARCHAR(20) NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "est_courante" BOOLEAN NOT NULL DEFAULT false,
    "est_archivee" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "annee_scolaire_pkey" PRIMARY KEY ("id_annee_scolaire")
);

-- CreateTable
CREATE TABLE "periode" (
    "id_periode" SERIAL NOT NULL,
    "id_annee_scolaire" INTEGER NOT NULL,
    "type_periode" VARCHAR(20) NOT NULL,
    "numero_ordre" INTEGER NOT NULL,
    "libelle" VARCHAR(50),
    "date_debut" DATE,
    "date_fin" DATE,

    CONSTRAINT "periode_pkey" PRIMARY KEY ("id_periode")
);

-- CreateTable
CREATE TABLE "niveau" (
    "id_niveau" SERIAL NOT NULL,
    "id_etablissement" INTEGER NOT NULL,
    "libelle" VARCHAR(100) NOT NULL,
    "ordre_affichage" INTEGER,
    "cycle" VARCHAR(50),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "niveau_pkey" PRIMARY KEY ("id_niveau")
);

-- CreateTable
CREATE TABLE "classe" (
    "id_classe" SERIAL NOT NULL,
    "id_annee_scolaire" INTEGER NOT NULL,
    "id_niveau" INTEGER NOT NULL,
    "id_enseignant_titulaire" INTEGER,
    "code_classe" VARCHAR(20) NOT NULL,
    "libelle" VARCHAR(100) NOT NULL,
    "capacite_max" INTEGER,
    "salle_principale" VARCHAR(50),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "classe_pkey" PRIMARY KEY ("id_classe")
);

-- CreateTable
CREATE TABLE "matiere" (
    "id_matiere" SERIAL NOT NULL,
    "id_etablissement" INTEGER NOT NULL,
    "code_matiere" VARCHAR(20) NOT NULL,
    "libelle" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "matiere_pkey" PRIMARY KEY ("id_matiere")
);

-- CreateTable
CREATE TABLE "coefficient" (
    "id_coefficient" SERIAL NOT NULL,
    "id_matiere" INTEGER NOT NULL,
    "id_niveau" INTEGER NOT NULL,
    "valeur" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "coefficient_pkey" PRIMARY KEY ("id_coefficient")
);

-- CreateTable
CREATE TABLE "inscription" (
    "id_inscription" SERIAL NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "date_inscription" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'inscrit',
    "date_sortie" DATE,
    "motif_sortie" TEXT,

    CONSTRAINT "inscription_pkey" PRIMARY KEY ("id_inscription")
);

-- CreateTable
CREATE TABLE "attribution_enseignant" (
    "id_attribution" SERIAL NOT NULL,
    "id_enseignant" INTEGER NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "id_matiere" INTEGER NOT NULL,
    "id_annee_scolaire" INTEGER NOT NULL,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "attribution_enseignant_pkey" PRIMARY KEY ("id_attribution")
);

-- CreateTable
CREATE TABLE "emploi_du_temps" (
    "id_emploi" SERIAL NOT NULL,
    "id_attribution" INTEGER NOT NULL,
    "jour_semaine" INTEGER NOT NULL,
    "heure_debut" TIME(6) NOT NULL,
    "heure_fin" TIME(6) NOT NULL,
    "salle" VARCHAR(50),
    "date_effective" DATE,
    "est_annule" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "emploi_du_temps_pkey" PRIMARY KEY ("id_emploi")
);

-- CreateTable
CREATE TABLE "type_evaluation" (
    "id_type_evaluation" SERIAL NOT NULL,
    "id_etablissement" INTEGER NOT NULL,
    "libelle" VARCHAR(100) NOT NULL,
    "ponderation_pourcentage" DECIMAL(5,2),
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "type_evaluation_pkey" PRIMARY KEY ("id_type_evaluation")
);

-- CreateTable
CREATE TABLE "periode_evaluation" (
    "id_periode_evaluation" SERIAL NOT NULL,
    "id_periode" INTEGER NOT NULL,
    "libelle" VARCHAR(100),
    "date_debut" DATE,
    "date_fin" DATE,

    CONSTRAINT "periode_evaluation_pkey" PRIMARY KEY ("id_periode_evaluation")
);

-- CreateTable
CREATE TABLE "evaluation" (
    "id_evaluation" SERIAL NOT NULL,
    "id_attribution" INTEGER NOT NULL,
    "id_periode_evaluation" INTEGER NOT NULL,
    "id_type_evaluation" INTEGER NOT NULL,
    "intitule" VARCHAR(200),
    "note_maximale" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "date_evaluation" DATE,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'brouillon',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_pkey" PRIMARY KEY ("id_evaluation")
);

-- CreateTable
CREATE TABLE "note" (
    "id_note" SERIAL NOT NULL,
    "id_evaluation" INTEGER NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_enseignant_saisie" INTEGER NOT NULL,
    "valeur_note" DECIMAL(5,2),
    "est_absent" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id_note")
);

-- CreateTable
CREATE TABLE "absence" (
    "id_absence" SERIAL NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_emploi_du_temps" INTEGER NOT NULL,
    "id_enseignant" INTEGER NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "type_absence" VARCHAR(20) NOT NULL,
    "est_justifie" BOOLEAN NOT NULL DEFAULT false,
    "motif_justification" TEXT,
    "notification_envoyee" BOOLEAN NOT NULL DEFAULT false,
    "date_absence" DATE NOT NULL,
    "heure_absence" TIME(6),
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_pkey" PRIMARY KEY ("id_absence")
);

-- CreateTable
CREATE TABLE "sanction" (
    "id_sanction" SERIAL NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "id_auteur" INTEGER NOT NULL,
    "type_sanction" VARCHAR(50) NOT NULL,
    "motif" TEXT NOT NULL,
    "date_sanction" DATE NOT NULL,
    "date_debut_effet" DATE,
    "date_fin_effet" DATE,
    "observations" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanction_pkey" PRIMARY KEY ("id_sanction")
);

-- CreateTable
CREATE TABLE "notification" (
    "id_notification" SERIAL NOT NULL,
    "id_destinataire" INTEGER NOT NULL,
    "id_expediteur" INTEGER,
    "type_notification" VARCHAR(50) NOT NULL,
    "canal" VARCHAR(20) NOT NULL,
    "titre" VARCHAR(200),
    "contenu" TEXT NOT NULL,
    "est_lu" BOOLEAN NOT NULL DEFAULT false,
    "est_envoye" BOOLEAN NOT NULL DEFAULT false,
    "date_envoi" TIMESTAMP(3),
    "date_lecture" TIMESTAMP(3),
    "metadata" JSONB,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id_notification")
);

-- CreateTable
CREATE TABLE "bulletin" (
    "id_bulletin" SERIAL NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_periode" INTEGER NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "moyenne_generale" DECIMAL(5,2),
    "rang" INTEGER,
    "total_eleves_classe" INTEGER,
    "total_absences" INTEGER NOT NULL DEFAULT 0,
    "total_retards" INTEGER NOT NULL DEFAULT 0,
    "appreciation_generale" TEXT,
    "decision_conseil" VARCHAR(100),
    "fichier_pdf_url" VARCHAR(500),
    "date_generation" TIMESTAMP(3),
    "est_publie" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletin_pkey" PRIMARY KEY ("id_bulletin")
);

-- CreateTable
CREATE TABLE "ligne_bulletin" (
    "id_ligne_bulletin" SERIAL NOT NULL,
    "id_bulletin" INTEGER NOT NULL,
    "id_matiere" INTEGER NOT NULL,
    "id_enseignant" INTEGER NOT NULL,
    "moyenne_matiere" DECIMAL(5,2),
    "coefficient" DECIMAL(4,2),
    "points_ponderes" DECIMAL(7,2),
    "rang_matiere" INTEGER,
    "note_min_classe" DECIMAL(5,2),
    "note_max_classe" DECIMAL(5,2),
    "appreciation_enseignant" TEXT,

    CONSTRAINT "ligne_bulletin_pkey" PRIMARY KEY ("id_ligne_bulletin")
);

-- CreateTable
CREATE TABLE "rapport_ia" (
    "id_rapport_ia" SERIAL NOT NULL,
    "id_eleve" INTEGER NOT NULL,
    "id_periode" INTEGER NOT NULL,
    "forces" JSONB,
    "faiblesses" JSONB,
    "recommandations" JSONB,
    "evolution_recente" JSONB,
    "score_risque" DECIMAL(5,2),
    "niveau_risque" VARCHAR(20),
    "date_generation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_modele" VARCHAR(50),

    CONSTRAINT "rapport_ia_pkey" PRIMARY KEY ("id_rapport_ia")
);

-- CreateIndex
CREATE UNIQUE INDEX "etablissement_code_etablissement_key" ON "etablissement"("code_etablissement");

-- CreateIndex
CREATE UNIQUE INDEX "role_libelle_key" ON "role"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_id_etablissement_email_key" ON "utilisateur"("id_etablissement", "email");

-- CreateIndex
CREATE UNIQUE INDEX "enseignant_id_utilisateur_key" ON "enseignant"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "enseignant_matricule_key" ON "enseignant"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "eleve_id_utilisateur_key" ON "eleve"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "eleve_matricule_key" ON "eleve"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "parent_id_utilisateur_key" ON "parent"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "lien_parent_eleve_id_parent_id_eleve_key" ON "lien_parent_eleve"("id_parent", "id_eleve");

-- CreateIndex
CREATE UNIQUE INDEX "annee_scolaire_id_etablissement_libelle_key" ON "annee_scolaire"("id_etablissement", "libelle");

-- CreateIndex
CREATE UNIQUE INDEX "niveau_id_etablissement_libelle_key" ON "niveau"("id_etablissement", "libelle");

-- CreateIndex
CREATE UNIQUE INDEX "matiere_code_matiere_key" ON "matiere"("code_matiere");

-- CreateIndex
CREATE UNIQUE INDEX "coefficient_id_matiere_id_niveau_key" ON "coefficient"("id_matiere", "id_niveau");

-- CreateIndex
CREATE UNIQUE INDEX "inscription_id_eleve_id_classe_key" ON "inscription"("id_eleve", "id_classe");

-- CreateIndex
CREATE UNIQUE INDEX "attribution_enseignant_id_enseignant_id_classe_id_matiere_i_key" ON "attribution_enseignant"("id_enseignant", "id_classe", "id_matiere", "id_annee_scolaire");

-- CreateIndex
CREATE UNIQUE INDEX "note_id_evaluation_id_eleve_key" ON "note"("id_evaluation", "id_eleve");

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_id_eleve_id_periode_key" ON "bulletin"("id_eleve", "id_periode");

-- CreateIndex
CREATE UNIQUE INDEX "ligne_bulletin_id_bulletin_id_matiere_key" ON "ligne_bulletin"("id_bulletin", "id_matiere");

-- AddForeignKey
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignant" ADD CONSTRAINT "enseignant_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleve" ADD CONSTRAINT "eleve_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_parent_eleve" ADD CONSTRAINT "lien_parent_eleve_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "parent"("id_parent") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_parent_eleve" ADD CONSTRAINT "lien_parent_eleve_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annee_scolaire" ADD CONSTRAINT "annee_scolaire_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periode" ADD CONSTRAINT "periode_id_annee_scolaire_fkey" FOREIGN KEY ("id_annee_scolaire") REFERENCES "annee_scolaire"("id_annee_scolaire") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niveau" ADD CONSTRAINT "niveau_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classe" ADD CONSTRAINT "classe_id_annee_scolaire_fkey" FOREIGN KEY ("id_annee_scolaire") REFERENCES "annee_scolaire"("id_annee_scolaire") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classe" ADD CONSTRAINT "classe_id_niveau_fkey" FOREIGN KEY ("id_niveau") REFERENCES "niveau"("id_niveau") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classe" ADD CONSTRAINT "classe_id_enseignant_titulaire_fkey" FOREIGN KEY ("id_enseignant_titulaire") REFERENCES "enseignant"("id_enseignant") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matiere" ADD CONSTRAINT "matiere_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coefficient" ADD CONSTRAINT "coefficient_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "matiere"("id_matiere") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coefficient" ADD CONSTRAINT "coefficient_id_niveau_fkey" FOREIGN KEY ("id_niveau") REFERENCES "niveau"("id_niveau") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "classe"("id_classe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_enseignant" ADD CONSTRAINT "attribution_enseignant_id_enseignant_fkey" FOREIGN KEY ("id_enseignant") REFERENCES "enseignant"("id_enseignant") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_enseignant" ADD CONSTRAINT "attribution_enseignant_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "classe"("id_classe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_enseignant" ADD CONSTRAINT "attribution_enseignant_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "matiere"("id_matiere") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_enseignant" ADD CONSTRAINT "attribution_enseignant_id_annee_scolaire_fkey" FOREIGN KEY ("id_annee_scolaire") REFERENCES "annee_scolaire"("id_annee_scolaire") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emploi_du_temps" ADD CONSTRAINT "emploi_du_temps_id_attribution_fkey" FOREIGN KEY ("id_attribution") REFERENCES "attribution_enseignant"("id_attribution") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_evaluation" ADD CONSTRAINT "type_evaluation_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periode_evaluation" ADD CONSTRAINT "periode_evaluation_id_periode_fkey" FOREIGN KEY ("id_periode") REFERENCES "periode"("id_periode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_id_attribution_fkey" FOREIGN KEY ("id_attribution") REFERENCES "attribution_enseignant"("id_attribution") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_id_periode_evaluation_fkey" FOREIGN KEY ("id_periode_evaluation") REFERENCES "periode_evaluation"("id_periode_evaluation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_id_type_evaluation_fkey" FOREIGN KEY ("id_type_evaluation") REFERENCES "type_evaluation"("id_type_evaluation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_id_evaluation_fkey" FOREIGN KEY ("id_evaluation") REFERENCES "evaluation"("id_evaluation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_id_enseignant_saisie_fkey" FOREIGN KEY ("id_enseignant_saisie") REFERENCES "enseignant"("id_enseignant") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence" ADD CONSTRAINT "absence_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence" ADD CONSTRAINT "absence_id_emploi_du_temps_fkey" FOREIGN KEY ("id_emploi_du_temps") REFERENCES "emploi_du_temps"("id_emploi") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence" ADD CONSTRAINT "absence_id_enseignant_fkey" FOREIGN KEY ("id_enseignant") REFERENCES "enseignant"("id_enseignant") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence" ADD CONSTRAINT "absence_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "classe"("id_classe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanction" ADD CONSTRAINT "sanction_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanction" ADD CONSTRAINT "sanction_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "classe"("id_classe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanction" ADD CONSTRAINT "sanction_id_auteur_fkey" FOREIGN KEY ("id_auteur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_destinataire_fkey" FOREIGN KEY ("id_destinataire") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_expediteur_fkey" FOREIGN KEY ("id_expediteur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletin" ADD CONSTRAINT "bulletin_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletin" ADD CONSTRAINT "bulletin_id_periode_fkey" FOREIGN KEY ("id_periode") REFERENCES "periode"("id_periode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletin" ADD CONSTRAINT "bulletin_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "classe"("id_classe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_bulletin" ADD CONSTRAINT "ligne_bulletin_id_bulletin_fkey" FOREIGN KEY ("id_bulletin") REFERENCES "bulletin"("id_bulletin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_bulletin" ADD CONSTRAINT "ligne_bulletin_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "matiere"("id_matiere") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_bulletin" ADD CONSTRAINT "ligne_bulletin_id_enseignant_fkey" FOREIGN KEY ("id_enseignant") REFERENCES "enseignant"("id_enseignant") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_ia" ADD CONSTRAINT "rapport_ia_id_eleve_fkey" FOREIGN KEY ("id_eleve") REFERENCES "eleve"("id_eleve") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_ia" ADD CONSTRAINT "rapport_ia_id_periode_fkey" FOREIGN KEY ("id_periode") REFERENCES "periode"("id_periode") ON DELETE RESTRICT ON UPDATE CASCADE;
