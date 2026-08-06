-- =====================================================================
--  Purge RGPD
--  Une plaque est une donnée personnelle : le réglage
--  conservation_jours doit correspondre à une suppression RÉELLE.
-- =====================================================================

-- On purge par PLAQUE, pas par ligne :
--   - une plaque encore garée (dernier événement = ENTREE) n'est jamais
--     touchée, quelle que soit son ancienneté ;
--   - une plaque partie est effacée en entier, ENTREE comprise, ce qui
--     évite de laisser des SORTIE orphelines dans le journal.
--
-- La détection « encore garée » est faite ici en SQL direct et non via
-- la vue `vehicule_present` : cette vue est en security_invoker, donc
-- soumise au RLS de l'appelant. Depuis une fonction planifiée elle peut
-- ne rien renvoyer — et la purge effacerait alors des voitures encore
-- sur le parking.
create or replace function purger_evenements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  supprimes integer;
begin
  with dernier as (
    select distinct on (etablissement_id, plaque)
      etablissement_id, plaque, type, survenu_le
    from evenement
    order by etablissement_id, plaque, survenu_le desc, cree_le desc
  ),
  a_purger as (
    select d.etablissement_id, d.plaque
    from dernier d
    join etablissement et on et.id = d.etablissement_id
    where d.type = 'SORTIE'
      and d.survenu_le < now() - (et.conservation_jours || ' days')::interval
  )
  delete from evenement e
  using a_purger p
  where e.etablissement_id = p.etablissement_id
    and e.plaque = p.plaque;

  get diagnostics supprimes = row_count;
  return supprimes;
end;
$$;

-- Sans ce revoke, EXECUTE est accordé à PUBLIC par défaut : n'importe
-- quel compte connecté pourrait appeler une fonction security definer
-- qui contourne le RLS et déclencher une suppression sur tous les
-- établissements.
revoke execute on function purger_evenements() from public, anon, authenticated;

-- Tous les jours à 3 h du matin
select cron.schedule('purge-parking', '0 3 * * *', 'select purger_evenements()');
