# Les photos

Déposer les fichiers ici, puis écrire leur nom dans `../contenu/etapes.js`.

Tant qu'un fichier est absent, le carnet montre **l'emplacement du tirage** —
du papier photo non exposé, avec sa référence au crayon — et jamais une image
cassée. On peut donc écrire les légendes d'abord et coller les photos ensuite.

## Nommer

Le nom du fichier n'a pas d'importance pour le site, seulement pour s'y
retrouver plus tard. Une convention qui tient : `numéro-lieu-sujet.jpg`.

```
medias/01-trieste-parking.jpg
medias/p1-04-carrelage.jpg      ← p1 = pellicule 1, pour une planche
```

## Préparer

- **Format** : `.jpg` pour les photos, `.webp` si on veut plus léger.
- **Taille** : 1600 px sur le grand côté suffit largement. Un tirage ne
  dépasse jamais 500 px à l'écran ; au-delà on ne fait qu'alourdir la page.
- **Poids** : viser 200 à 400 Ko par photo. Une page de carnet en porte
  rarement plus de deux, mais elles se chargent toutes au fil du dépliage.
- **Cadrage** : le site recadre au centre selon `cadrage` (`paysage`, `portrait`
  ou `carre`). Si le sujet n'est pas au centre, mieux vaut recadrer soi-même
  avant de déposer le fichier.

Les images ne sont pas retouchées par le site : ce qu'on dépose est ce qui
s'affiche. Pas de filtre sépia — le papier autour suffit.

## Orientation

Certains téléphones enregistrent l'orientation dans les métadonnées EXIF plutôt
que dans l'image. Si une photo apparaît couchée, la faire pivoter puis
réenregistrer dans n'importe quel visualiseur : cela réécrit les pixels et le
problème disparaît partout.
