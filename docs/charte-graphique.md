# Charte graphique

État : **livrée, deux directions, mise en page A implémentée**.

La charte a été rendue sous forme de deux directions complètes partageant les mêmes noms de
tokens :

| | Direction A — « Signalétique » | Direction B — « Poste de nuit » |
|---|---|---|
| Fichier | `src/styles/tokens-signaletique.css` | `src/styles/tokens-poste-de-nuit.css` |
| Défaut | clair | sombre |
| Typographie | Archivo (une seule famille) | IBM Plex Sans + Mono |
| Action | bleu `#12459E` | jaune de signalisation `#F5B720` |
| Ligne | 56 px | 48 px |
| Champ plaque | 38 px | 40 px, chasse fixe |

**La mise en page implémentée est celle de A.** Basculer de direction change la palette, la
typographie, les densités, les rayons et la police auto-hébergée ; cela ne déplace pas le
bandeau de commande comme le fait la maquette B, qui demanderait un second jeu de
composants.

```bash
npm run charte -- poste-de-nuit
```

La commande réécrit l'`@import` de `src/styles/tokens.css` et la constante de
`src/lib/charte.ts` — les deux doivent rester d'accord, d'où le script.

La première moitié de ce document est le brief remis à la conception, conservé pour que la
charte puisse être jugée sur les contraintes qui l'ont commandée et non sur le goût. Les
écarts d'intégration sont consignés à la fin.

---

---

## Le contexte, qui gouverne chaque choix

L'outil est utilisé debout, au comptoir d'une réception d'hôtel, pendant qu'un client
attend. Un seul écran : un champ « plaque » qui sert à la fois à chercher un véhicule et à
enregistrer son entrée, une liste des voitures présentes, un bouton « sortie » par ligne.

Le produit est jugé sur un seul critère : **la vitesse de saisie**. Si enregistrer une
voiture prend plus de 10 secondes, ou paraît laborieux à un moment chargé, le personnel
arrête de le faire et le registre devient faux. Toute décision esthétique qui coûte une
demi-seconde au comptoir est une mauvaise décision.

**Utilisatrices** : la gérante de l'hôtel, puis le personnel de réception. Aucune
compétence technique, aucune formation. Âges variés.

**Terrain** : hôtels en Corse et au Sénégal. Français. Lumière du jour parfois violente sur
l'écran. Appareil non déterminé — doit fonctionner de 360 px de large (téléphone tenu à une
main) à un écran de PC de comptoir.

Les plaques ne sont pas toutes françaises : italiennes, allemandes, sénégalaises, longueurs
et formats variables.

## Livrables attendus

Deux directions visuelles **distinctes**, pas deux variantes de la même. Pour chacune : un
nom, deux phrases de parti pris, et la justification de ce parti pris par le critère
« vitesse au comptoir ».

1. **Jeu de tokens complet** en CSS custom properties, prêt à remplacer
   `src/styles/tokens.css` : couleurs sémantiques (fond, surface, texte primaire et
   secondaire, bordure, accent, action, succès, alerte, danger), échelle typographique,
   échelle d'espacement, rayons, ombres, durées. Tokens nommés par leur **rôle**, jamais
   par leur valeur. Thème clair **et** thème sombre — le sombre, c'est le comptoir à 2 h du
   matin.
2. **Choix typographique** : deux familles maximum, plaque lisible d'un coup d'œil à un
   mètre, fallbacks système explicites. Une police distante ne doit pas être un point de
   défaillance quand le réseau de l'hôtel tombe.
3. **Spécification des composants**, avec états repos / focus / survol / désactivé /
   chargement / erreur :
   - en-tête, compteur d'occupation, jauge, état « parking complet » ;
   - champ plaque — l'élément le plus important de l'écran ;
   - bouton d'enregistrement ;
   - ligne d'un véhicule : plaque, chambre, durée de stationnement, bouton sortie ;
   - marquage discret d'un véhicule « sans chambre » — signalé, jamais traité comme une
     faute ;
   - barre d'annulation, visible 6 secondes après une sortie ;
   - états vides : parking vide, recherche sans résultat ;
   - indicateur hors-ligne et nombre d'entrées en attente de synchronisation. Le réseau
     coupe. L'écran doit le dire sans inquiéter.
4. **Maquette HTML+CSS autonome** de l'écran principal dans chaque direction, cinq
   véhicules d'exemple, un seul fichier, aucune dépendance externe.

## Contraintes non négociables

- Contraste WCAG AA minimum partout, AAA sur le champ plaque et le compteur.
- Cibles tactiles de 44 px minimum.
- Utilisable au pouce d'une seule main : actions fréquentes dans le tiers bas de l'écran.
- `prefers-reduced-motion` et `prefers-color-scheme` respectés.
- Aucune information portée par la couleur seule.
- Aucune dépendance à une image ou une icône chargée depuis un CDN.
- Ni jargon d'entreprise, ni ton ludique. C'est un outil de travail.

## Ce qui est refusé d'avance

- Un tableau de bord. Il n'y a rien à contempler, seulement un geste à faire.
- Cartes, ombres portées et dégradés qui gonflent chaque ligne. Une ligne doit rester
  dense : on doit en voir dix sans faire défiler.
- Une palette « startup ». L'objet de référence est la plaque d'immatriculation elle-même
  et la signalétique routière : haut contraste, lisible en une fraction de seconde, sans
  personnalité inutile.

---

## Écarts d'intégration

Quatre endroits où le code ne suit pas la charte à la lettre. Chacun est un arbitrage, pas
un oubli.

**1. Un parking complet ne bloque pas l'enregistrement.** La charte spécifie un champ plaque
désactivé quand le parking est plein, avec le message « enregistrez une sortie avant une
entrée ». Le bandeau et la jauge noire sont bien là, mais la saisie reste possible.

Refuser l'entrée d'une voiture qui est physiquement garée rendrait le registre faux, ce qui
est le seul mode de défaillance que `CLAUDE.md` § 2 cherche à empêcher : « le journal devient
incomplet, et les cinq usages s'effondrent en même temps ». Un compteur à 19/18 est une
information exacte et gênante ; un compteur à 18/18 avec une voiture non enregistrée est une
information fausse et rassurante.

**2. Le champ chambre passe sous le champ plaque en dessous de 420 px.** La maquette 1a du
canvas ne montre pas où loge le champ chambre. Placé sur la même ligne à 375 px, il ampute
le champ plaque de trois caractères — la charte exige exactement l'inverse (« une plaque
étrangère longue reste entière, jamais rognée »). Il passe donc dessous sur téléphone, et
revient à côté sur écran de comptoir. Le champ chambre est au plancher tactile (44 px) et
non à la hauteur du champ plaque (72 px) : la différence de taille dit laquelle des deux
saisies compte.

Coût mesuré : bandeau de saisie à 290 px sur téléphone (375 px), 217 px sur comptoir
(560 px) — sept lignes visibles au lieu des huit annoncées par la charte pour 1a.

**3. Les paliers de taille du champ plaque tiennent jusqu'à quatorze caractères affichés.**
Au-delà (seize caractères identiques et larges, ce qui n'est pas une plaque), le texte
défile dans le champ. La saisie est plafonnée à seize caractères.

**4. Les deux fichiers de tokens ont une ligne modifiée chacun.** `--font-ui` et
`--font-plate` reçoivent en tête la variable produite par `next/font`, qui auto-héberge la
police au build. Aucune requête vers un CDN à l'exécution — c'est la contrainte du brief, et
la charte demandait explicitement l'auto-hébergement. Les noms littéraux et les piles
système restent en repli.

## Ce que la charte laisse ouvert

Le document se termine sur huit arbitrages non tranchés, qui demandent du terrain :
transformer le bouton en « Sortie de … » quand la plaque est déjà là, garder ou non le champ
chambre, afficher la durée ou l'heure d'arrivée, fusionner 0/O et 1/I à la recherche, la
capacité réelle du parking, le soleil sur le comptoir, l'abrégé « sans ch. » de 1b, et le
double sens du jaune dans 1b.

Aucun n'est implémenté dans un sens ou dans l'autre au-delà de ce que fait déjà le code.

## Réserve de méthode

`CLAUDE.md` § 9 place le design en étape 4, **après** les premiers retours d'usage réel. La
charte a donc été lancée en avance sur l'ordre de travail prévu. L'isolation dans un fichier
unique est ce qui rend cette avance peu coûteuse : si l'usage réel contredit la direction
retenue, la reprise reste un remplacement de fichier.
