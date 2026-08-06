-- =====================================================================
--  Parking hôtel — schéma v1
--  Périmètre : un établissement, une utilisatrice, un appareil.
--  Ce qui est ici est difficile à changer plus tard ; le reste attend.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Établissement
-- ---------------------------------------------------------------------
create table etablissement (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text        not null,
  places              int         not null check (places > 0),
  chambre_obligatoire boolean     not null default false,
  conservation_jours  int         not null default 90 check (conservation_jours between 1 and 1095),
  fuseau              text        not null default 'Europe/Paris',
  cree_le             timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2. Membres — relie un compte Supabase à un établissement
--    Une seule ligne au départ. La table existe pour ne pas avoir à
--    la rétro-ajouter le jour du deuxième hôtel.
-- ---------------------------------------------------------------------
create table membre (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  etablissement_id uuid not null references etablissement(id) on delete cascade,
  role             text not null default 'reception'
                     check (role in ('reception','direction')),
  cree_le          timestamptz not null default now()
);

create index membre_etablissement_idx on membre(etablissement_id);


-- ---------------------------------------------------------------------
-- 3. Journal d'événements
--
--    On n'écrit jamais l'état courant : on empile des faits.
--    - id généré CÔTÉ CLIENT  -> un rejeu hors-ligne est idempotent
--    - survenu_le  = heure réelle du geste (peut être passée)
--    - cree_le     = heure d'arrivée au serveur
--      L'écart entre les deux, c'est la durée de coupure réseau.
-- ---------------------------------------------------------------------
create table evenement (
  id               uuid        primary key,           -- fourni par le client
  etablissement_id uuid        not null references etablissement(id) on delete cascade,
  type             text        not null check (type in ('ENTREE','SORTIE')),
  plaque           text        not null check (plaque ~ '^[A-Z0-9]{4,12}$'),  -- normalisée
  plaque_saisie    text        not null,              -- telle que tapée, pour l'affichage
  chambre          text,                              -- null = sans chambre
  survenu_le       timestamptz not null,
  cree_le          timestamptz not null default now(),
  auteur           uuid        references auth.users(id)
);

-- Recherche par plaque et reconstruction de l'état courant
create index evenement_plaque_idx
  on evenement (etablissement_id, plaque, survenu_le desc);

-- Purge et statistiques
create index evenement_temps_idx
  on evenement (etablissement_id, survenu_le);


-- ---------------------------------------------------------------------
-- 4. État courant = projection du journal
--    security_invoker : indispensable, sinon la vue s'exécute avec les
--    droits de son propriétaire et court-circuite le RLS.
-- ---------------------------------------------------------------------
create view vehicule_present
with (security_invoker = true)
as
select
  etablissement_id,
  plaque,
  plaque_saisie,
  chambre,
  survenu_le as entree_le
from (
  select distinct on (etablissement_id, plaque)
    etablissement_id, plaque, plaque_saisie, chambre, type, survenu_le
  from evenement
  order by etablissement_id, plaque, survenu_le desc, cree_le desc
) dernier
where type = 'ENTREE';
