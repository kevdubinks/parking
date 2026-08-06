-- =====================================================================
--  Échafaudage Supabase pour un PostgreSQL nu.
--
--  Sert UNIQUEMENT à faire tourner le test d'isolation sans Docker ni
--  projet Supabase. N'est jamais appliqué sur la base réelle : ce
--  fichier n'est pas dans supabase/migrations/.
--
--  CE QU'IL REPRODUIT FIDÈLEMENT
--    - les rôles anon / authenticated / service_role / supabase_auth_admin
--    - les GRANT que Supabase pose automatiquement sur toute table
--      créée dans `public` (c'est ce qui permet à `authenticated`
--      d'atteindre les tables, le RLS filtrant ensuite)
--    - auth.uid() lu depuis request.jwt.claims -> sub
--
--  CE QU'IL NE REPRODUIT PAS
--    - l'émission réelle des jetons par GoTrue
--    - le branchement du Custom Access Token Hook dans le tableau de
--      bord Supabase
--    - pg_cron : `cron.schedule` est un leurre qui enregistre l'appel
--      sans rien planifier
--
--  Autrement dit : ce harnais valide les POLITIQUES, pas le
--  déploiement. Le test doit aussi être passé sur la base réelle.
-- =====================================================================

-- Rôles PostgREST.
-- Les rôles sont globaux au CLUSTER, pas à la base : ce prélude est
-- rejoué sur plusieurs bases jetables dans la même instance, donc la
-- création doit être idempotente.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('anon', false),
      ('authenticated', false),
      ('service_role', true),
      ('supabase_auth_admin', false)
    ) as t(nom, bypass)
  loop
    if not exists (select 1 from pg_roles where rolname = r.nom) then
      execute format(
        'create role %I nologin noinherit %s',
        r.nom,
        case when r.bypass then 'bypassrls' else '' end
      );
    end if;
  end loop;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase pose ces privilèges par défaut sur tout ce qui est créé
-- ensuite dans `public`. Sans eux, `authenticated` se heurterait à un
-- refus de droits AVANT le RLS — et le test mesurerait la mauvaise
-- chose : un UPDATE refusé pour absence de GRANT n'est pas un UPDATE
-- filtré par une politique.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- Schéma auth minimal
-- ---------------------------------------------------------------------
create schema auth;

create table auth.users (
  id    uuid primary key,
  email text unique
);

grant usage on schema auth to authenticated, anon, service_role, supabase_auth_admin;

-- Identité du porteur du jeton. Même implémentation que Supabase :
-- le claim `sub`, rien d'autre.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )::uuid;
$$;


-- ---------------------------------------------------------------------
-- pg_cron en trompe-l'œil
--
-- La migration de purge appelle cron.schedule(). On ne veut pas
-- installer pg_cron pour un test de RLS, mais on veut que l'appel
-- réussisse — et qu'il soit visible, pour qu'une planification qui
-- disparaîtrait du schéma se voie.
-- ---------------------------------------------------------------------
create schema cron;

create table cron.job (
  jobid    bigserial primary key,
  jobname  text,
  schedule text,
  command  text
);

create or replace function cron.schedule(job_name text, schedule text, command text)
returns bigint
language sql
as $$
  insert into cron.job (jobname, schedule, command)
  values (job_name, schedule, command)
  returning jobid;
$$;
