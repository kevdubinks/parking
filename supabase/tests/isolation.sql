-- =====================================================================
--  Test d'isolation — OBLIGATOIRE avant toute écriture de front.
--
--  Tant que ce script n'est pas passé au vert, considérer que
--  l'isolation ne marche pas.
--
--  Sur la base réelle :
--      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f isolation.sql
--
--  Sur un PostgreSQL local jetable, sans Docker ni Supabase :
--      npm run test:isolation
--
--  Le script crée deux établissements et deux comptes jetables, se fait
--  passer pour chacun en injectant les claims JWT comme le fait
--  PostgREST, vérifie l'étanchéité, puis annule tout (rollback).
--  Rien n'est laissé derrière lui.
--
--  Les identifiants transitent par des variables de session et non par
--  une table temporaire : une fois passé en rôle `authenticated`, une
--  table appartenant à `postgres` n'est plus lisible, et le script
--  échouerait sur un refus de droits avant d'avoir rien testé.
-- =====================================================================

begin;

do $$
declare
  etab_a uuid;
  etab_b uuid;
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  -- Un troisième compte, réception chez A : c'est lui qui prouve que
  -- l'écran des réglages ne peut pas être détourné par le personnel.
  user_c uuid := gen_random_uuid();
begin
  insert into etablissement (nom, places) values ('Test A', 10) returning id into etab_a;
  insert into etablissement (nom, places) values ('Test B', 10) returning id into etab_b;

  -- Comptes minimaux : le FK de `membre` pointe sur auth.users.
  insert into auth.users (id, email)
  values (user_a, 'a@test.invalid'), (user_b, 'b@test.invalid'), (user_c, 'c@test.invalid');

  insert into membre (user_id, etablissement_id, role)
  values (user_a, etab_a, 'direction'), (user_b, etab_b, 'direction'),
         (user_c, etab_a, 'reception');

  insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, chambre, survenu_le, auteur)
  values (gen_random_uuid(), etab_a, 'ENTREE', 'AA111AA', 'AA-111-AA', '12', now(), user_a),
         (gen_random_uuid(), etab_b, 'ENTREE', 'BB222BB', 'BB-222-BB', '34', now(), user_b);

  perform set_config('test.etab_a', etab_a::text, true);
  perform set_config('test.etab_b', etab_b::text, true);
  perform set_config('test.user_a', user_a::text, true);
  perform set_config('test.user_b', user_b::text, true);
  perform set_config('test.user_c', user_c::text, true);
end $$;


-- ---------------------------------------------------------------------
-- On devient l'utilisateur A
-- ---------------------------------------------------------------------
do $$
declare
  claims text;
  n int;
begin
  claims := json_build_object(
    'sub', current_setting('test.user_a'),
    'role', 'authenticated',
    'app_metadata', json_build_object(
      'etablissement_id', current_setting('test.etab_a'),
      'role', 'direction')
  )::text;

  perform set_config('request.jwt.claims', claims, true);
  perform set_config('role', 'authenticated', true);

  -- 1. A voit son propre événement
  select count(*) into n from evenement;
  if n <> 1 then
    raise exception 'ÉCHEC 1 — A devrait voir exactement 1 événement, il en voit %', n;
  end if;

  -- 2. A ne voit AUCUN événement de B
  select count(*) into n from evenement
   where etablissement_id = current_setting('test.etab_b')::uuid;
  if n <> 0 then
    raise exception 'ÉCHEC 2 — A voit % événement(s) de B. FUITE.', n;
  end if;

  -- 3. A ne voit qu'un établissement : le sien
  select count(*) into n from etablissement;
  if n <> 1 then
    raise exception 'ÉCHEC 3 — A voit % établissements au lieu de 1', n;
  end if;

  -- 4. A ne voit pas la ligne membre de B
  select count(*) into n from membre;
  if n <> 1 then
    raise exception 'ÉCHEC 4 — A voit % lignes membre au lieu de 1', n;
  end if;

  -- 5. La vue vehicule_present est étanche elle aussi
  select count(*) into n from vehicule_present;
  if n <> 1 then
    raise exception 'ÉCHEC 5 — la vue laisse voir % véhicules au lieu de 1', n;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- A tente d'écrire chez B — doit être refusé par le with check
-- ---------------------------------------------------------------------
do $$
declare
  ok boolean := false;
begin
  begin
    insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
    values (gen_random_uuid(), current_setting('test.etab_b')::uuid,
            'ENTREE', 'ZZ999ZZ', 'ZZ-999-ZZ', now(), current_setting('test.user_a')::uuid);
  exception when insufficient_privilege then
    ok := true;
  end;
  if not ok then
    raise exception 'ÉCHEC 6 — A a réussi à écrire un événement chez B. FUITE.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- A tente de falsifier l'auteur d'un événement chez lui — refusé
-- ---------------------------------------------------------------------
do $$
declare
  ok boolean := false;
begin
  begin
    insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
    values (gen_random_uuid(), current_setting('test.etab_a')::uuid,
            'ENTREE', 'YY888YY', 'YY-888-YY', now(), current_setting('test.user_b')::uuid);
  exception when insufficient_privilege then
    ok := true;
  end;
  if not ok then
    raise exception 'ÉCHEC 7 — A a écrit un événement en se faisant passer pour B.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- Le journal n'est ni modifiable ni effaçable
-- ---------------------------------------------------------------------
do $$
declare
  n int;
begin
  update evenement set chambre = '999';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'ÉCHEC 8 — % ligne(s) modifiée(s) dans un journal append-only', n;
  end if;

  delete from evenement;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'ÉCHEC 9 — % ligne(s) supprimée(s) dans un journal append-only', n;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- La purge n'est pas appelable par un compte connecté
-- ---------------------------------------------------------------------
do $$
declare
  ok boolean := false;
begin
  begin
    perform purger_evenements();
  exception when insufficient_privilege then
    ok := true;
  end;
  if not ok then
    raise exception 'ÉCHEC 10 — un compte authenticated a pu déclencher la purge.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- Sans claim d'établissement, on ne voit rien (échec fermé)
-- ---------------------------------------------------------------------
do $$
declare
  n int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  select count(*) into n from evenement;
  if n <> 0 then
    raise exception 'ÉCHEC 11 — % événement(s) visible(s) sans claim établissement', n;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- Écran des réglages : qui peut modifier l'établissement
--
-- Ce chemin d'écriture n'existait pas tant que les réglages se
-- faisaient dans le Table Editor. Depuis qu'un écran de l'application
-- les expose, il doit être tenu par le RLS et non par l'affichage.
-- ---------------------------------------------------------------------
do $$
declare
  n int;
begin
  -- La direction modifie son propre établissement
  perform set_config('request.jwt.claims', json_build_object(
    'sub', current_setting('test.user_a'), 'role', 'authenticated',
    'app_metadata', json_build_object(
      'etablissement_id', current_setting('test.etab_a'), 'role', 'direction')
  )::text, true);

  update etablissement set nom = 'Test A renommé';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'ÉCHEC 12 — la direction ne peut pas modifier son établissement (% ligne(s))', n;
  end if;

  -- ... et seulement le sien
  update etablissement set nom = 'Piraté'
   where id = current_setting('test.etab_b')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'ÉCHEC 13 — la direction de A a modifié l''établissement de B. FUITE.';
  end if;

  -- La réception ne modifie rien, même chez elle
  perform set_config('request.jwt.claims', json_build_object(
    'sub', current_setting('test.user_c'), 'role', 'authenticated',
    'app_metadata', json_build_object(
      'etablissement_id', current_setting('test.etab_a'), 'role', 'reception')
  )::text, true);

  update etablissement set places = 9999;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'ÉCHEC 14 — un compte réception a modifié les réglages (% ligne(s))', n;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- Intégrité des données écrites par le client
--
-- `survenu_le` et le texte libre viennent de l'appareil. Une entrée
-- datée dans le futur ne serait jamais remplacée par sa sortie : la
-- voiture resterait au registre indéfiniment.
-- ---------------------------------------------------------------------
do $$
declare
  ok boolean;
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', current_setting('test.user_a'), 'role', 'authenticated',
    'app_metadata', json_build_object(
      'etablissement_id', current_setting('test.etab_a'), 'role', 'direction')
  )::text, true);

  -- 17. Horloge en avance : refusé
  ok := false;
  begin
    insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
    values (gen_random_uuid(), current_setting('test.etab_a')::uuid, 'ENTREE',
            'FU111UR', 'FU-111-UR', now() + interval '2 hours',
            current_setting('test.user_a')::uuid);
  exception when check_violation then ok := true;
  end;
  if not ok then
    raise exception 'ÉCHEC 17 — un événement daté dans le futur a été accepté : la voiture serait ingérable.';
  end if;

  -- Une saisie hors ligne dans le passé reste légitime
  insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
  values (gen_random_uuid(), current_setting('test.etab_a')::uuid, 'ENTREE',
          'PA222SE', 'PA-222-SE', now() - interval '6 hours',
          current_setting('test.user_a')::uuid);

  -- 18. Texte libre démesuré : refusé
  ok := false;
  begin
    insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
    values (gen_random_uuid(), current_setting('test.etab_a')::uuid, 'ENTREE',
            'XX333XX', repeat('X', 500), now(), current_setting('test.user_a')::uuid);
  exception when check_violation then ok := true;
  end;
  if not ok then
    raise exception 'ÉCHEC 18 — une saisie de 500 caractères a été acceptée.';
  end if;
end $$;


reset role;


-- ---------------------------------------------------------------------
-- 19. Un compte peut être supprimé sans emporter le journal
--
--     On supprime le compte RÉCEPTION, pas la direction : le test du
--     hook qui suit a encore besoin de user_a et de sa ligne membre,
--     laquelle part en cascade avec le compte.
-- ---------------------------------------------------------------------
do $$
declare
  id_evt uuid := gen_random_uuid();
  existe int;
  sans_auteur int;
begin
  -- Un événement signé par la réception, posé hors RLS.
  insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, survenu_le, auteur)
  values (id_evt, current_setting('test.etab_a')::uuid, 'ENTREE',
          'RC444PT', 'RC-444-PT', now(), current_setting('test.user_c')::uuid);

  delete from auth.users where id = current_setting('test.user_c')::uuid;

  select count(*) into existe from evenement where id = id_evt;
  if existe <> 1 then
    raise exception 'ÉCHEC 19 — supprimer un compte a emporté les événements qu''il avait saisis.';
  end if;

  select count(*) into sans_auteur from evenement where id = id_evt and auteur is null;
  if sans_auteur <> 1 then
    raise exception 'ÉCHEC 19 — l''auteur n''a pas été détaché après suppression du compte.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- Le hook JWT construit bien le claim, même sans app_metadata préalable
-- (c'est le piège de jsonb_set : il ne crée que le dernier niveau)
-- ---------------------------------------------------------------------

do $$
declare
  sortie jsonb;
begin
  sortie := auth_hook_claims(
    json_build_object('user_id', current_setting('test.user_a'), 'claims', '{}'::json)::jsonb
  );

  if sortie -> 'claims' -> 'app_metadata' ->> 'etablissement_id'
     is distinct from current_setting('test.etab_a') then
    raise exception 'ÉCHEC 15 — le hook n''a pas injecté etablissement_id (sortie : %)', sortie;
  end if;

  if sortie -> 'claims' -> 'app_metadata' ->> 'role' is distinct from 'direction' then
    raise exception 'ÉCHEC 16 — le hook n''a pas injecté le rôle (sortie : %)', sortie;
  end if;
end $$;


do $$ begin
  raise notice '';
  raise notice '  ISOLATION : 19/19 — étanche.';
  raise notice '';
end $$;

rollback;
