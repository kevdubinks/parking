# manovoyage

**En ligne : https://kevdubinks.github.io/parking/**

Un voyage en Thaïlande, vu d'en haut. Quatre villes, quinze lieux, soixante
photos, 2 044 km — de Bangkok aux karsts d'Andaman.

Ce n'est pas un site avec une carte : c'est **une carte de bord**. L'écran de
siège d'un avion, en plus beau — la Terre, la route, et des compteurs qui
disent où l'on est. On y descend, on y atterrit, on repart.

## Les quatre altitudes

| | |
|---|---|
| **Croisière** | le globe entier. On le fait tourner à la souris ou au doigt. |
| **Approche** | la Thaïlande, ses quatre villes posées à leurs coordonnées. |
| **Ville** | son histoire, ses lieux, toutes ses photos. C'est la section Découverte. |
| **Carte postale** | une photo en grand. On la retourne : au dos, le mot de la ville, un timbre et le cachet. |

**`Échap` remonte d'un cran. Toujours.** C'est la seule chose à savoir, et il
n'y a jamais rien d'empilé : pas de fil d'Ariane, pas de menu, pas de retour
arrière qui surprend.

| | |
|---|---|
| glisser | faire tourner la Terre |
| molette | descendre, remonter |
| clic sur une ville | y aller — l'avion se déplace, il ne saute pas |
| clic sur une photo | l'ouvrir en carte postale |
| clic sur la carte, ou `Espace` | la retourner |
| `←` `→` | la photo précédente, la suivante |
| `Échap` | remonter d'une altitude |

## Le globe

Une projection orthographique dessinée au canvas : la Terre vue d'assez loin
pour que la courbure se voie. Les contours viennent de Natural Earth. Deux
niveaux de détail, et le fin ne se charge qu'à l'approche, quand les côtes
grossières commenceraient à se voir.

Le point de vue est toujours au centre de l'écran. Descendre sur une ville,
c'est amener ses coordonnées là et faire grandir le rayon : d'où la sensation
de descente, sans qu'aucune caméra n'existe vraiment.

Un vol prend d'abord un peu de hauteur avant de redescendre. Sans cette bosse,
un déplacement est un fondu ; avec, c'est un vol.

Les repères ne se chevauchent jamais : chaque bulle cherche une place libre
au-dessus, en dessous, ou de côté. Le point, lui, ne bouge pas — il est sur les
coordonnées. Bangkok et Ayutthaya sont à soixante-dix kilomètres l'une de
l'autre et restent lisibles.

## Écrire

Tout est dans **`contenu/lieux.js`**. Les étapes, coordonnées, kilométrages et
photos viennent de l'export du voyage, conservé tel quel dans
`medias/source-manovoyage.json`.

```js
{
  id: 'bangkok', nom: 'Bangkok', sous: 'Krung Thep',
  lat: 13.7398, lng: 100.5106,
  mot: 'Ce qui s’écrit au dos de la carte postale.',
  histoire: [ 'Un paragraphe.', 'Un autre.' ],   // section Découverte
  sites: [
    { nom: 'Wat Pho', texte: 'Bangkok, rive est du Chao Phraya.',
      lat: 13.7465, lng: 100.4927, km: 0,
      photos: [ { fichier: 'medias/01-wat-pho/01-01.jpg',
                  legende: 'le bouddha couché, et les offrandes à sa tête',
                  ref: '01-01' } ] }
  ]
}
```

**Les textes parlent des lieux, pas du voyage de quelqu'un.** Histoire,
géologie, ce qu'on voit sur place : rien qui prétende être un souvenir. Les
légendes décrivent ce qui est sur la photo. Le jour où de vrais souvenirs
viennent s'ajouter, ils prennent la place de ces textes-là — ou s'y ajoutent.

## Les photos

Deux tailles, et c'est important : `medias/<étape>/<ref>.jpg` en pleine
résolution, et `medias/vignettes/<ref>.jpg` à 400 px. Les repères et les
grilles n'affichent que les vignettes ; la photo pleine taille n'est chargée
qu'à l'ouverture de la carte postale. Sans cela, ouvrir une ville tirerait
vingt méga-octets d'un coup.

La vignette se déduit du nom du fichier — rien à écrire dans le contenu. Pour
en régénérer après avoir ajouté des photos :

```
python3 -c "
from PIL import Image; import glob, os
os.makedirs('medias/vignettes', exist_ok=True)
for f in glob.glob('medias/*/*.jpg'):
    if 'vignettes' in f: continue
    im = Image.open(f); im.thumbnail((400, 800), Image.LANCZOS)
    im.save('medias/vignettes/' + os.path.basename(f), 'JPEG', quality=76, optimize=True)
"
```

## Les fichiers

```
index.html
contenu/lieux.js      villes, lieux, textes, photos — le seul fichier pour écrire
donnees/terre.js      les contours des terres (Natural Earth, deux détails)
scripts/globe.js      la projection et le dessin du globe
scripts/vol.js        les altitudes, les vols, les repères, la carte postale
styles/vol.css        le poste de pilotage
medias/               les soixante photos, plus les vignettes
medias/source-manovoyage.json   l'export du voyage, tel qu'il est arrivé
```

Aucune dépendance, aucune compilation, aucun serveur : ouvrir `index.html`
suffit. Il se dépose tel quel chez n'importe quel hébergeur de fichiers
statiques.

## La mise en ligne

GitHub Pages sert la branche **`gh-pages`**, qui ne contient que le contenu de
`manovoyage/` à sa racine. Le workflow `.github/workflows/manovoyage.yml` l'y
recopie à chaque modification poussée : il n'y a rien à faire à la main.

`gh-pages` est une branche produite, pas une branche de travail — ne rien y
écrire directement, ce serait écrasé à la publication suivante.

Le site porte un `noindex` : accessible par son lien, mais absent des moteurs
de recherche. Une ligne à retirer dans `index.html` le jour où l'on veut être
trouvé.

Pour une adresse plus jolie, deux chemins : un nom de domaine (déposer un
fichier `CNAME` contenant le domaine à la racine du site), ou un dépôt dédié
`manovoyage`, qui donnerait `kevdubinks.github.io/manovoyage/`. Aucun cookie, aucun compte, aucun service
tiers — seules les polices viennent de Google, avec repli local.

## L'ancienne version

Ce dossier a d'abord été un carnet dépliant en accordéon. Il est intact dans
l'historique git, au commit « Le vrai voyage : Thaïlande » :

```
git show 6fc101f --stat
git checkout 6fc101f -- manovoyage   # pour le récupérer entièrement
```
