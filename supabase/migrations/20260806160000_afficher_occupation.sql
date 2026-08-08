-- =====================================================================
--  Le compteur d'occupation ne vaut que si le registre est complet.
--
--  Question ouverte n° 4 du CLAUDE.md : si la réception n'est pas tenue
--  en permanence, des voitures entrent sans être saisies, et le
--  compteur ment. Un chiffre faux est pire que pas de chiffre — il
--  donne l'assurance de savoir.
--
--  C'est un réglage par établissement au sens du § 10 : deux hôtels le
--  régleraient différemment, donc il n'a pas sa place en dur dans le
--  code.
-- =====================================================================

alter table etablissement
  add column afficher_occupation boolean not null default true;

comment on column etablissement.afficher_occupation is
  'false quand la réception n''est pas tenue en permanence : le compteur '
  'et la jauge sont masqués plutôt que d''afficher un chiffre faux.';
