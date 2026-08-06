# Parking hôtel — registre des plaques

Registre des véhicules garés sur le parking d'un hôtel : quelle voiture appartient à quelle
chambre, combien de places restent libres.

Le périmètre, les décisions figées et les raisons derrière chacune sont dans
[`CLAUDE.md`](CLAUDE.md), qui fait foi. Ce fichier ne décrit que la mise en route.

---

## Principe

Le produit n'écrit jamais un état courant : il empile des faits dans un journal
append-only (`ENTREE` / `SORTIE`). Le nombre de places occupées, l'historique, la
facturation à venir et la détection des squatteurs sont **cinq lectures du même journal**,
pas cinq fonctionnalités.

Conséquences directes, visibles partout dans le code :

- l'`id` d'un événement est généré **côté client**, ce qui rend le rejeu de la file
  hors-ligne idempotent ;
- il n'existe **aucune** politique `UPDATE` ni `DELETE` sur la table `evenement` — une
  erreur de saisie se corrige par un nouvel événement ;
- l'isolation entre établissements vit **dans le RLS**, jamais dans le code applicatif.

## Stack

| | |
|---|---|
| Base, auth | Supabase (Postgres, RLS, pg_cron), région Europe |
| Front | Next.js 15 (App Router), TypeScript |
| Requêtes | `supabase-js` uniquement — jamais Prisma, qui contourne le RLS |
| Hors-ligne | IndexedDB + rejeu `on conflict (id) do nothing` |

---

## Mise en route

### 1. Base de données

Créer un projet Supabase en région Europe, puis appliquer les migrations dans l'ordre :

```bash
supabase link --project-ref <ref-du-projet>
supabase db push
```

Ou, sans le CLI, coller les trois fichiers de `supabase/migrations/` dans le SQL Editor,
dans l'ordre de leur horodatage.

### 2. Hook JWT

Dans **Authentication → Hooks → Custom Access Token**, sélectionner
`public.auth_hook_claims`.

Sans ce hook, le jeton ne porte pas `etablissement_id`, le RLS ne laisse rien passer et
l'écran reste vide. C'est le comportement voulu : le système échoue **fermé**.

> La signature de ce hook a changé plusieurs fois côté Supabase. Vérifier la
> documentation à jour avant de le modifier.

### 3. Test d'isolation — obligatoire

Aucune écriture de front ne doit être considérée comme fiable tant que ce script n'est pas
passé au vert :

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
```

Il crée deux établissements et deux comptes jetables, se fait passer pour chacun, et
vérifie onze propriétés : lecture cloisonnée, écriture impossible chez le voisin,
impossibilité de falsifier l'auteur, journal ni modifiable ni effaçable, purge inaccessible
à un compte connecté, et absence totale de lecture sans claim. Tout est annulé en fin de
script (`rollback`), rien n'est laissé dans la base.

Un `ÉCHEC n` signifie que l'isolation ne tient pas. Ne rien déployer avant de l'avoir
corrigé.

### 4. Amorçage

Créer le compte de la gérante dans **Authentication → Users**, puis adapter l'adresse
e-mail dans `supabase/seed.sql` et l'exécuter une fois.

### 5. Application

```bash
cp .env.example .env.local
```

Remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` depuis
**Project Settings → API**. La clé `service_role` n'a rien à faire dans ce fichier.

```bash
npm install
npm run dev
```

### 6. Déploiement

Vercel, fonctions en `cdg1` (proximité de la base européenne). Reporter les deux variables
d'environnement dans le projet Vercel.

---

## Organisation du code

```
src/
  app/                  routes ; page.tsx est l'écran unique
  components/           Registre, ligne véhicule, barre d'annulation
  lib/
    config.ts           réglages de l'établissement (en dur en v1)
    plaque.ts           normalisation, validation permissive, affichage
    journal.ts          IndexedDB : journal local, file d'attente, projection
    useRegistre.ts      orchestration lecture / écriture / synchronisation
    supabase/           clients navigateur et serveur
  styles/tokens.css     LA CHARTE GRAPHIQUE, en un seul fichier
supabase/
  migrations/           schéma, RLS + hook JWT, purge RGPD
  tests/isolation.sql   test d'étanchéité entre établissements
docs/prototype-v1.html  prototype de référence, autonome
```

### La charte tient dans un fichier

Aucun composant ne contient de couleur, de taille ni d'espacement en dur : tout lit les
variables de [`src/styles/tokens.css`](src/styles/tokens.css). Changer de charte, c'est
remplacer ce fichier — pas refondre les écrans.

Le contenu actuel est **provisoire** : il reprend la direction du prototype pour que
l'application soit utilisable pendant la validation de la charte définitive. Le brief de
cadrage est dans [`docs/charte-graphique.md`](docs/charte-graphique.md).

---

## Ce qui est volontairement absent

Enrôlement d'appareil, code d'accès, rôles, écran d'administration, temps réel,
facturation, exports, statistiques, historique consultable.

Ce n'est pas un manque : c'est la v1. Tout cela s'ajoutera sur la **même table**, sans
réécriture. Les écrans d'administration sont l'endroit où les produits gonflent et meurent.

## RGPD

Une plaque d'immatriculation est une donnée personnelle.

- `conservation_jours` correspond à une **purge réelle** (`pg_cron`, tous les jours à 3 h),
  pas à un affichage. Une plaque encore garée n'est jamais purgée, quelle que soit son
  ancienneté.
- Aucune plaque n'est écrite dans les logs applicatifs.
- Prévoir une affichette d'information client à l'accueil de l'hôtel.
