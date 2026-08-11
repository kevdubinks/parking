-- =====================================================================
--  Trois trous d'intégrité, trouvés en relisant le schéma.
--
--  À appliquer sur une base encore vide ou presque : les trois
--  contraintes sont validées immédiatement. Sur une base chargée,
--  ajouter `not valid` puis `validate constraint` séparément, pour ne
--  pas verrouiller la table pendant la vérification.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Une horloge en avance gelait une voiture dans le registre
--
--    `survenu_le` est fourni par le client — c'est voulu, c'est ce qui
--    donne l'heure réelle du geste après une coupure. Mais rien ne le
--    bornait.
--
--    Une tablette dont la date est en avance (elles le sont souvent)
--    produit des ENTREE dans le futur. La projection garde le DERNIER
--    événement par plaque, au sens de `survenu_le`. Une fois l'horloge
--    remise à l'heure, toutes les SORTIE suivantes portent une date
--    ANTÉRIEURE : elles ne remplacent jamais l'entrée fautive. La
--    voiture reste au registre indéfiniment, le compteur est faux, et
--    aucun geste au comptoir ne peut le corriger.
--
--    On tolère une heure d'écart — largement de quoi absorber une
--    dérive d'horloge ordinaire — et on refuse au-delà. Un refus est
--    bruyant côté application ; une voiture fantôme ne l'est pas.
--
--    Aucune borne dans le passé : une saisie hors ligne remontant à
--    plusieurs heures est parfaitement légitime.
-- ---------------------------------------------------------------------
alter table evenement
  add constraint evenement_horloge
  check (survenu_le <= cree_le + interval '1 hour');


-- ---------------------------------------------------------------------
-- 2. Un compte de personnel ne pouvait plus être supprimé
--
--    `auteur` référençait auth.users sans action de suppression, donc
--    NO ACTION. Dès qu'une personne avait saisi un seul véhicule,
--    supprimer son compte — départ, erreur de création, demande
--    d'effacement — échouait sur une violation de clé étrangère.
--
--    `set null` garde l'événement, qui est le seul à avoir de la valeur
--    en cas de litige, et laisse partir le compte. L'auteur devient
--    inconnu, ce qui est exactement la vérité.
-- ---------------------------------------------------------------------
alter table evenement drop constraint evenement_auteur_fkey;

alter table evenement
  add constraint evenement_auteur_fkey
  foreign key (auteur) references auth.users(id) on delete set null;

-- Sans cet index, supprimer un compte parcourt tout le journal.
create index evenement_auteur_idx on evenement (auteur);


-- ---------------------------------------------------------------------
-- 3. Texte libre sans borne
--
--    « Le contenu de la base est une entrée non fiable » (CLAUDE.md
--    § 6). L'application limite la saisie, mais l'application n'est pas
--    la frontière : n'importe quel porteur de jeton parle directement à
--    PostgREST. Rien n'empêchait d'y déposer des mégaoctets.
--
--    Les bornes sont larges — il s'agit d'empêcher l'absurde, pas de
--    contraindre une plaque étrangère ou un numéro de chambre exotique.
-- ---------------------------------------------------------------------
alter table evenement
  add constraint evenement_plaque_saisie_longueur
  check (char_length(plaque_saisie) between 1 and 32);

alter table evenement
  add constraint evenement_chambre_longueur
  check (chambre is null or char_length(chambre) between 1 and 16);

alter table etablissement
  add constraint etablissement_nom_longueur
  check (char_length(nom) between 1 and 120);
