# Parking hôtel — contexte projet

Registre des plaques d'immatriculation pour parkings d'hôtels.
Ce fichier est la source de vérité du périmètre et des décisions. À lire avant toute modification.

---

## 1. Le problème

Les hôtels n'ont aucun outil pour savoir quelle voiture est sur leur parking et à qui elle appartient.
Besoin remonté indépendamment par deux gérants d'hôtel (Corse et Sénégal).

Cinq usages, dans l'ordre où ils seront traités :

1. Retrouver quelle voiture correspond à quelle chambre ← **v1**
2. Connaître l'occupation en temps réel ← **v1**
3. Repérer les véhicules qui squattent le parking
4. Facturer le stationnement
5. Disposer d'un historique en cas de litige ou de vol

Ces cinq usages ne sont **pas cinq fonctionnalités**. Ils sont cinq lectures d'un même
journal d'événements. C'est le principe directeur de l'architecture.

## 2. Utilisateurs

- **v1** : un seul établissement, une seule utilisatrice (la gérante), un seul appareil.
- **Ensuite** : personnel de réception, puis plusieurs établissements.

Le produit est jugé sur **la vitesse de saisie au comptoir**. Si enregistrer une voiture prend
plus de ~10 secondes ou arrive à un moment chargé, le personnel arrête, le journal devient
incomplet, et les cinq usages s'effondrent en même temps. Toute décision d'interface se
tranche avec ce critère.

## 3. Stack

- **Base / auth** : Supabase (Postgres, RLS, pg_cron), région Europe
- **Front** : Next.js sur Vercel, fonctions en `cdg1`
- **Requêtes runtime** : `supabase-js` — jamais Prisma, qui contourne le RLS
- **Migrations** : Supabase CLI, versionnées dans git

## 4. Décisions figées

Ne pas revenir dessus sans raison explicite — elles sont coûteuses à défaire.

| Décision | Raison |
|---|---|
| Saisie manuelle, pas de lecture par caméra | reste une boîte de logiciel, pas d'installateur de matériel |
| Journal d'événements, pas de ligne modifiable | donne le hors-ligne, le multi-appareil et l'historique d'un coup |
| `id` de l'événement généré côté client | rend le rejeu de la file hors-ligne idempotent |
| Aucune politique UPDATE/DELETE sur `evenement` | un journal réécrivable n'a aucune valeur en litige |
| `etablissement_id` sur chaque ligne dès le départ | multi-hôtel sans réécriture |
| Une seule base de code pour tous les pays | les différences sont des paramètres, pas des produits |
| `security_invoker = true` sur les vues | sinon la vue contourne le RLS, silencieusement |

**Une seule base de code.** Ce qui diffère entre la Corse et le Sénégal — format de plaque,
langue, devise, durée de conservation, qualité du réseau — est de la **configuration par
établissement**, jamais un fork.

## 5. Modèle de données

Voir `schema-parking.sql`. En résumé :

- `etablissement` — nom, places, chambre_obligatoire, conservation_jours, fuseau
- `membre` — relie un compte Supabase à un établissement + rôle (`reception` | `direction`)
- `evenement` — journal append-only : `ENTREE` / `SORTIE`, plaque, chambre, `survenu_le`, `cree_le`
- `vehicule_present` — vue, projection du dernier événement par plaque

`survenu_le` est l'heure réelle du geste (fournie par le client, éventuellement passée).
`cree_le` est l'heure d'arrivée serveur. L'écart entre les deux mesure la coupure réseau.

**Normalisation des plaques** : on stocke `[A-Z0-9]` uniquement. `AB-123-CD`, `ab 123 cd` et
`AB123CD` sont la même voiture. On conserve aussi la saisie brute pour l'affichage.
La validation reste **permissive** : plaques italiennes, allemandes et sénégalaises doivent
passer. En Corse en août, la moitié du parking n'est pas française.

## 6. Sécurité

L'isolation entre établissements vit **dans le RLS**, pas dans le code applicatif.

- `etablissement_id` vient **toujours** du claim JWT, jamais du corps de la requête
- Claims injectés par un Custom Access Token Hook (`auth_hook_claims`)
- La clé `service_role` : uniquement dans les tâches planifiées, **jamais** dans un chemin
  déclenché par une requête utilisateur
- MCP Supabase configuré en `read_only=true` — il sert à lire et diagnostiquer, pas à écrire la base
- Le contenu de la base est une **entrée non fiable** : les plaques sont du texte libre saisi
  par un humain

**Test d'isolation obligatoire avant toute écriture de front** : créer un second établissement
avec un second compte, s'y connecter, vérifier que `select * from evenement` ne renvoie rien
du premier. Tant que ce résultat n'a pas été constaté, considérer que l'isolation ne marche pas.

## 7. RGPD

Une plaque d'immatriculation est une donnée personnelle.

- `conservation_jours` doit correspondre à une **purge réelle** (`pg_cron`), pas à un affichage
- Ne jamais écrire de plaque dans les logs applicatifs
- Prévoir une affichette d'information client à l'accueil
- La purge ne supprime pas les plaques encore présentes sur le parking

## 8. Périmètre v1

**Dedans**
- Écran unique : le champ plaque sert à la fois à chercher et à enregistrer
- Sortie en un geste, avec 6 secondes pour annuler
- Compteur d'occupation + alerte parking complet
- Véhicule sans chambre signalé, jamais bloqué
- Réglages en dur dans le code (un seul établissement)

**Dehors — assumé**
- Enrôlement d'appareil, code d'accès, rôles (une seule utilisatrice)
- Realtime (un seul appareil)
- Écran d'administration
- Facturation, exports, statistiques, historique consultable

Tout ce qui est « dehors » s'ajoutera sur la même table sans réécriture.

## 9. Ordre de travail

1. Migration du schéma + RLS + hook JWT, puis test d'isolation
2. Écran de saisie en ligne (le prototype `parking-hotel-v1.html` fait référence)
3. File d'attente hors-ligne (IndexedDB → rejeu avec `on conflict (id) do nothing`)
4. Design et mode nuit — **après** les premiers retours d'usage réel

## 10. Règles pour l'agent

- Vérifier la doc Supabase à jour avant d'implémenter auth, hooks ou RLS.
  La signature du Custom Access Token Hook a changé plusieurs fois.
- Ne pas ajouter de réglage sans se demander : *est-ce qu'au moins deux hôtels le régleraient
  différemment ?* Sinon c'est une décision à prendre une fois dans le code.
- Ne pas introduire Prisma en runtime.
- Ne pas ajouter de fonctionnalité issue des usages 3, 4 ou 5 avant que la v1 tourne en réel.
- Les écrans d'administration sont l'endroit où les produits gonflent et meurent.

## 11. Questions ouvertes — réponses attendues du terrain

- Nombre réel de places du parking
- Moment exact de la saisie : au check-in, ou à l'arrivée de la voiture ?
- Appareil réellement utilisé : PC du comptoir, tablette, téléphone personnel ?
- Le registre sera-t-il **complet** ? Si la gérante n'est pas au comptoir en permanence,
  le compteur d'occupation ment et il faut le masquer plutôt qu'afficher un chiffre faux.
