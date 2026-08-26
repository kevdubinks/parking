# Les photos

Soixante tirages, rangés par étape, plus `source-manovoyage.json` : l'export du
voyage tel qu'il est arrivé (étapes, coordonnées, kilométrages, listes de
photos). C'est de là que viennent les données du carnet.

Pour ajouter une étape ou des vues, déposer les fichiers ici puis les citer dans
`../contenu/etapes.js`. Tant qu'un fichier est absent, le carnet montre
l'emplacement du tirage — du papier photo non exposé avec sa référence au
crayon — et jamais une image cassée.

## Préparer un fichier

- **Format** : `.jpg`, ou `.webp` pour plus léger.
- **Taille** : 1200 px sur le grand côté suffit. Un tirage ne dépasse jamais
  500 px à l'écran ; au-delà, on n'alourdit que le chargement.
- **Poids** : 200 à 400 Ko. Les tirages ne sont chargés qu'à l'approche de leur
  pli, mais une page en porte parfois douze.
- **Proportions** : celles du carnet sont 3:4, comme les photos existantes, et à
  ce format rien n'est recadré. Une vue d'un autre format entre quand même :
  soit on la laisse telle quelle, soit on lui met un `cadrage` explicite et elle
  est recadrée au centre.

Les images ne sont pas retouchées par le site : ce qu'on dépose est ce qui
s'affiche. Pas de filtre — le papier autour suffit.

## Orientation

Certains téléphones enregistrent l'orientation dans les métadonnées EXIF plutôt
que dans l'image. Si une photo apparaît couchée, la faire pivoter puis
réenregistrer dans n'importe quel visualiseur : cela réécrit les pixels et le
problème disparaît partout.

Les soixante photos du carnet sont arrivées sans métadonnées — ni date, ni
position. Les coordonnées et les distances viennent donc du fichier
`source-manovoyage.json`, pas des images.
