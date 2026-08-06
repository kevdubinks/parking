-- =====================================================================
--  Test d'isolation — OBLIGATOIRE avant toute écriture de front.
--
--  Tant que ce script n'est pas passé au vert, considérer que
--  l'isolation ne marche pas.
--
--  Usage :  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f isolation.sql
--
--  Le script crée deux établissements et deux comptes jetables, se fait
--  passer pour chacun en injectant les claims JWT comme le fait
--  PostgREST, vérifie l'étanchéité, puis annule tout (rollback).
--  Rien n'est laissé derrière lui.
-- =====================================================================

begin;

-- On se met dans la peau d'un client PostgREST : rôle authenticated,
-- claims lus depuis request.jwt.claims.
create temporary table _t (cle text primary key, val uuid);

do $$
declare
  etab_a uuid;
  etab_b uuid;
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
begin
  insert into etablissement (nom, places) values ('Test A', 10) returning id into etab_a;
  insert into etablissement (nom, places) values ('Test B', 10) returning id into etab_b;

  -- Comptes minimaux : le FK de `membre` pointe sur auth.users.
  insert into auth.users (id, instance_id, aud, role, email)
  values (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.invalid'),
         (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.invalid');

  insert into membre (user_id, etablissement_id, role)
  values (user_a, etab_a, 'direction'), (user_b, etab_b, 'direction');

  insert into evenement (id, etablissement_id, type, plaque, plaque_saisie, chambre, survenu_le, auteur)
  values (gen_random_uuid(), etab_a, 'ENTREE', 'AA111AA', 'AA-111-AA', '12', now(), user_a),
         (gen_random_uuid(), etab_b, 'ENTREE', 'BB222BB', 'BB-222-BB', '34', now(), user_b);

  insert into _t values ('etab_a', etab_a), ('etab_b', etab_b), ('user_a', user_a), ('user_b', user_b);
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
    'sub', (select val from _t where cle='user_a'),
    'role', 'authenticated',
    'app_metadata', json_build_object(
      'etablissement_id', (select val from _t where cle='etab_a'),
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
   where etablissement_id = (select val from _t where cle='etab_b');
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
    values (gen_random_uuid(), (select val from _t where cle='etab_b'),
            'ENTREE', 'ZZ999ZZ', 'ZZ-999-ZZ', now(), (select val from _t where cle='user_a'));
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
    values (gen_random_uuid(), (select val from _t where cle='etab_a'),
            'ENTREE', 'YY888YY', 'YY-888-YY', now(), (select val from _t where cle='user_b'));
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


reset role;

do $$ begin
  raise notice '';
  raise notice '  ISOLATION : 11/11 — étanche.';
  raise notice '';
end $$;

rollback;
