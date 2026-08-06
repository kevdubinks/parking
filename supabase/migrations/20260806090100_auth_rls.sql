-- =====================================================================
--  Claims JWT + RLS
--  L'isolation entre établissements vit ICI, pas dans le code applicatif.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Custom Access Token Hook
--    Injecte etablissement_id et role dans le jeton, pour éviter une
--    sous-requête sur `membre` à chaque ligne lue.
--    À déclarer ensuite dans Authentication > Hooks.
--
--    Attention : jsonb_set ne crée que le DERNIER niveau du chemin.
--    Si `app_metadata` est absent des claims, un jsonb_set direct sur
--    '{app_metadata,etablissement_id}' renvoie l'objet inchangé, sans
--    erreur — le hook échoue alors en silence et plus personne ne voit
--    rien. D'où le coalesce explicite ci-dessous.
-- ---------------------------------------------------------------------
create or replace function auth_hook_claims(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m record;
  claims jsonb;
  meta   jsonb;
begin
  select etablissement_id, role into m
  from membre where user_id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);
  meta   := coalesce(claims->'app_metadata', '{}'::jsonb);

  if m.etablissement_id is not null then
    meta := meta
      || jsonb_build_object('etablissement_id', m.etablissement_id::text)
      || jsonb_build_object('role', m.role);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', meta, true);
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant execute on function auth_hook_claims(jsonb) to supabase_auth_admin;
revoke execute on function auth_hook_claims(jsonb) from authenticated, anon, public;

grant usage on schema public to supabase_auth_admin;
grant select on table membre to supabase_auth_admin;

-- Le hook lit `membre` alors que le RLS y est actif : une politique
-- dédiée, sinon le hook ne trouve jamais la ligne et n'injecte rien.
create policy membre_lecture_hook on membre
  for select to supabase_auth_admin using (true);


-- ---------------------------------------------------------------------
-- 2. Lecture des claims, utilisée par toutes les politiques
-- ---------------------------------------------------------------------
create or replace function etab_courant()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'etablissement_id',
    ''
  )::uuid;
$$;

create or replace function role_courant()
returns text
language sql
stable
as $$
  select current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'role';
$$;


-- ---------------------------------------------------------------------
-- 3. Politiques
-- ---------------------------------------------------------------------
alter table etablissement enable row level security;
alter table membre        enable row level security;
alter table evenement     enable row level security;

-- Établissement : lecture pour ses membres, modification réservée
create policy etablissement_lecture on etablissement
  for select to authenticated using (id = etab_courant());

create policy etablissement_modification on etablissement
  for update to authenticated
  using (id = etab_courant() and role_courant() = 'direction')
  with check (id = etab_courant() and role_courant() = 'direction');

-- Membre : chacun ne voit que sa propre ligne
create policy membre_lecture on membre
  for select to authenticated using (user_id = auth.uid());

-- Événements : lecture sur son établissement
create policy evenement_lecture on evenement
  for select to authenticated using (etablissement_id = etab_courant());

-- Écriture : l'établissement et l'auteur sont imposés, pas choisis.
-- C'est ce with check qui empêche un client d'écrire chez le voisin.
create policy evenement_ecriture on evenement
  for insert to authenticated with check (
    etablissement_id = etab_courant()
    and auteur = auth.uid()
  );

-- Volontairement : aucune politique UPDATE ni DELETE sur evenement.
-- Un journal qu'on peut réécrire ne vaut rien en cas de litige.
-- Une erreur de saisie se corrige par un événement SORTIE, pas par un
-- effacement.
