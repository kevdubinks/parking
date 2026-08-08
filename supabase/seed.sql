-- =====================================================================
--  Amorçage — un établissement, une utilisatrice.
--
--  À exécuter une fois, depuis le SQL Editor Supabase, APRÈS avoir créé
--  le compte de la gérante dans Authentication > Users.
--
--  Remplacer l'e-mail ci-dessous, rien d'autre.
--
--  LES VALEURS DE L'ÉTABLISSEMENT NE SONT PAS À DEVINER ICI.
--  Elles se règlent ensuite dans Table Editor > etablissement, et
--  l'application les relit au chargement suivant — sans redéploiement.
--  Celles posées ici sont volontairement neutres : le compteur
--  d'occupation reste masqué tant que le nombre de places réel n'a pas
--  été saisi, plutôt que d'afficher une capacité inventée.
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

  insert into etablissement (nom, places, chambre_obligatoire, conservation_jours, fuseau,
                             afficher_occupation)
  values ('Parking', 1, false, 90, 'Europe/Paris', false)
  returning id into etab;

  insert into membre (user_id, etablissement_id, role)
  values (uid, etab, 'direction')
  on conflict (user_id) do update set etablissement_id = excluded.etablissement_id;

  raise notice 'Établissement % créé, gérante rattachée.', etab;
  raise notice 'Réglez maintenant nom, places et afficher_occupation dans Table Editor.';
end $$;
