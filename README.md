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
passé au vert.

**Sans rien installer** — ni Docker, ni PostgreSQL, ni projet Supabase :

```bash
npm run test:isolation
```

Un PostgreSQL est téléchargé, démarré sur un port privé, chargé avec les migrations, testé,
puis supprimé. Le harnais fait deux choses :

1. il joue les **13 assertions** d'étanchéité (lecture cloisonnée, écriture impossible chez
   le voisin, auteur infalsifiable, journal ni modifiable ni effaçable, purge inaccessible à
   un compte connecté, aucune lecture sans claim, et le hook JWT qui injecte réellement
   `etablissement_id`) ;
2. il **recasse le schéma six fois**, une protection à la fois, et vérifie que le test s'en
   aperçoit à chaque fois. Un test d'étanchéité qu'on n'a jamais vu virer au rouge ne prouve
   rien.

État actuel : **13/13 assertions, 6/6 sabotages détectés**, sur PostgreSQL 18.4.

**Sur le projet réel** — l'étape que rien ne remplace. Elle vérifie ce que le harnais local
ne peut pas voir : que GoTrue émet bien des jetons, que le Custom Access Token Hook est
réellement activé, que le claim arrive jusqu'à PostgREST, et que le RLS tient de bout en
bout.

```bash
SUPABASE_URL=… SUPABASE_SECRET_KEY=… SUPABASE_PUBLISHABLE_KEY=… npm run test:isolation:live
```

Le script crée deux comptes et deux établissements jetables, **se connecte pour de vrai**,
attaque l'API avec le jeton de chacun, puis supprime ce qu'il a créé — et uniquement ça, par
identifiant. La clé secrète ne sert qu'à préparer et à nettoyer : les douze assertions
passent toutes par la clé publiable et un vrai jeton utilisateur, c'est-à-dire par le chemin
que suit l'application.

Il détecte en particulier un hook non branché, qui est la panne d'installation la plus
probable et la plus déroutante : le registre s'affiche vide sans qu'aucune erreur ne soit
levée.

Variante en SQL, si vous avez `psql` et l'accès direct à la base :

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
```

> Le harnais local valide les **politiques**. Il ne valide pas le **déploiement** :
> l'émission des jetons par GoTrue et le branchement du Custom Access Token Hook dans le
> tableau de bord Supabase n'existent que sur le projet réel. `supabase/tests/prelude-local.sql`
> est l'échafaudage qui remplace Supabase en local ; il n'est jamais appliqué à la base
> réelle, et il documente exactement ce qu'il ne simule pas.

Un `ÉCHEC n` signifie que l'isolation ne tient pas. Ne rien déployer avant de l'avoir
corrigé.

La logique de synchronisation, qui ne dépend ni de la base ni du navigateur, se vérifie de
la même façon :

```bash
npm test
```

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

### 6. Avant de laisser quelqu'un s'en servir

L'outil est destiné à un comptoir d'hôtel, avec des données de clients réels. Trois choses
ne sont pas facultatives :

- **`pg_cron` doit être activé** (Database → Extensions). Sans lui, la planification de la
  purge échoue et `conservation_jours` ne correspond plus à aucune suppression réelle.
- **Les sauvegardes retiennent les plaques purgées.** Une purge RGPD supprime les lignes de
  la base, pas les sauvegardes automatiques ni le PITR. La durée de rétention des
  sauvegardes fixe donc le vrai plancher de conservation. À aligner sur
  `conservation_jours`, ou à mentionner dans le registre de traitement.
- **L'affichette d'information client** à l'accueil, avant la première saisie.

Deux limites à connaître, écrites ici parce qu'elles se voient en exploitation et pas en
recette :

- **La file hors-ligne vit dans le navigateur d'un seul appareil.** Vider les données du
  site ou changer d'appareil perd les enregistrements pas encore partis. L'écran le dit
  quand la file est bloquée, mais rien ne peut le rattraper après coup.
- **Il n'y a pas de supervision.** Si le hook JWT est mal configuré ou la session expirée,
  l'écran affiche un bandeau rouge au comptoir — c'est tout. Personne n'est alerté à
  distance.

### 7. Déploiement

**Répartition** : Supabase ne porte que le back — base, RLS, auth, purge planifiée. Le front
est un projet Vercel branché sur ce dépôt GitHub : chaque `push` sur `main` déclenche un
déploiement. Il n'y a pas d'écran d'administration dans l'application ; la gestion se fait
depuis le tableau de bord Supabase (CLAUDE.md § 8).

1. Vercel → **Add New → Project** → importer `kevdubinks/parking`. Le framework est détecté,
   `vercel.json` fixe la région des fonctions à `cdg1`.
2. **Settings → Environment Variables**, sur les trois environnements :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | l'URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clé **publiable** (`sb_publishable_…`) |

   Ces deux valeurs sont figées dans le bundle **au build** : les modifier impose un
   redéploiement, un simple redémarrage ne suffit pas.

   La clé secrète n'est pas dans ce tableau, et ce n'est pas un oubli.

3. Vérifier que la région Vercel correspond à celle du projet Supabase. Chaque navigation
   déclenche une vérification de session côté serveur ; des fonctions à Washington devant une
   base à Francfort ajoutent un aller-retour transatlantique à un outil jugé sur dix
   secondes au comptoir. Si le projet Supabase n'est pas en Europe, corriger `regions` dans
   [`vercel.json`](vercel.json).

**Ce que Vercel n'installe pas** : le harnais PostgreSQL du test d'isolation pèse ~110 Mo de
binaires. Il est délibérément tenu hors des dépendances — Vercel installe les
`devDependencies` pour construire le front, et le téléchargerait à chaque déploiement pour
rien. `npm run test:isolation` le récupère à la demande, sans toucher à `package.json`.

---

## Organisation du code

```
src/
  app/                  routes ; page.tsx est l'écran unique
  components/           Registre, ligne véhicule, barre d'annulation
  lib/
    charte.ts           direction graphique active (police auto-hébergée)
    config.ts           réglages de l'établissement (en dur en v1)
    plaque.ts           normalisation, validation permissive, affichage
    journal.ts          IndexedDB : journal local, file d'attente, projection
    useRegistre.ts      orchestration lecture / écriture / synchronisation
    supabase/           clients navigateur et serveur
  styles/
    tokens.css              l'interrupteur — désigne la direction active
    tokens-signaletique.css direction A, clair, Archivo, bleu
    tokens-poste-de-nuit.css direction B, sombre, IBM Plex, jaune
scripts/charte.mjs      bascule de direction
supabase/
  migrations/           schéma, RLS + hook JWT, purge RGPD
  tests/isolation.sql   test d'étanchéité entre établissements
docs/prototype-v1.html  prototype de référence, autonome
```

### La charte tient dans un fichier

Aucun composant ne contient de couleur, de taille ni d'espacement en dur : tout lit les
variables de [`src/styles/tokens.css`](src/styles/tokens.css), qui ne fait que désigner la
direction active.

Deux directions sont livrées et partagent exactement les mêmes noms de tokens :

```bash
npm run charte                     # direction active
npm run charte -- poste-de-nuit    # bascule
```

La commande réécrit l'`@import` de `tokens.css` **et** la constante de `src/lib/charte.ts`,
qui décide quelle police est auto-hébergée au build — les deux doivent rester d'accord.

La **mise en page** implémentée est celle de la direction A (« Signalétique »). La bascule
change la palette, la typographie, les densités et les rayons ; elle ne déplace pas le
bandeau de commande comme le fait la maquette B.

Détail des directions et des quatre écarts d'intégration :
[`docs/charte-graphique.md`](docs/charte-graphique.md).

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
