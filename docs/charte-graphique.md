# Charte graphique — brief de cadrage

État : **en attente de validation**. Le fichier `src/styles/tokens.css` contient une
direction provisoire reprise du prototype, pour que l'application soit utilisable en
attendant.

Ce document est le brief remis à la conception. Il est reproduit ici pour que la charte
livrée puisse être jugée sur les contraintes qui l'ont commandée, et non sur le goût.

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

## Intégration

La charte validée remplace le contenu de `src/styles/tokens.css`, et rien d'autre. Aucun
composant ne porte de valeur en dur. Si une direction retenue impose un token qui n'existe
pas encore, l'ajouter à ce fichier et l'utiliser — ne jamais écrire la valeur dans un
composant.

## Réserve de méthode

`CLAUDE.md` § 9 place le design en étape 4, **après** les premiers retours d'usage réel. Ce
brief est donc lancé en avance sur l'ordre de travail prévu. L'isolation de la charte dans
un fichier unique est ce qui rend cette avance peu coûteuse : si l'usage réel contredit la
direction retenue, la reprise reste un remplacement de fichier.
