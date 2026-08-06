-- =====================================================================
--  Amorçage — un établissement, une utilisatrice.
--
--  À exécuter une fois, depuis le SQL Editor Supabase (rôle postgres),
--  APRÈS avoir créé le compte de la gérante dans Authentication > Users.
--
--  Remplacer l'e-mail ci-dessous, rien d'autre.
-- =====================================================================

do $$
declare
  email_gerante constant text := 'a-remplacer@exemple.fr';
  uid   uuid;
  etab  uuid;
begin
  select id into uid from auth.users where email = email_gerante;
  if uid is null then
    raise exception 'Compte % introuvable. Créez-le dans Authentication > Users avant.', email_gerante;
  end if;

  insert into etablissement (nom, places, chambre_obligatoire, conservation_jours, fuseau)
  values ('Hôtel — Parking', 18, false, 90, 'Europe/Paris')
  returning id into etab;

  insert into membre (user_id, etablissement_id, role)
  values (uid, etab, 'direction')
  on conflict (user_id) do update set etablissement_id = excluded.etablissement_id;

  raise notice 'Établissement % créé, gérante rattachée.', etab;
  raise notice 'Reportez cet identifiant dans src/lib/config.ts si besoin.';
end $$;
