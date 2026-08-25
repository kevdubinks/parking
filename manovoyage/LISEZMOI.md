# manovoyage

Un carnet de voyage qui se **déplie**. Thaïlande : quinze étapes, 2 044 km,
soixante tirages, de Bangkok aux karsts d'Andaman.

Le site n'est pas une suite d'articles : c'est une seule bande de papier pliée en
accordéon. On avance dedans latéralement, le pli qu'on lit est à plat, et le reste
du voyage est replié de part et d'autre — visiblement, physiquement. L'épaisseur
des plis à gauche et à droite dit combien de chemin il reste de chaque côté.

Chaque pli a un **dos**. Le recto porte les tirages ; le verso, sur papier
quadrillé, porte la position relevée, les distances et l'inventaire des tirages
de la page. Touche `V`, ou le bouton « voir le dos ».

Un **trait unique** traverse les dix-sept plis sans jamais s'interrompre, pliures
comprises. Ce n'est pas une décoration : c'est le profil du voyage en latitude,
tracé depuis les coordonnées relevées à chaque étape. Il monte jusqu'à Chiang Mai,
au 19ᵉ parallèle, et redescend jusqu'à la mer d'Andaman. Chaque étape tombe au
milieu de sa page, et une petite croix rouge marque l'endroit où le trait la touche.

## Se déplacer

| | |
|---|---|
| `←` `→` | déplier d'un pli |
| molette / doigt | fait défiler le texte ; arrivé en bas, passe au pli suivant |
| glisser | tirer la bande latéralement |
| clic sur un pli replié | l'ouvrir |
| clic sur un tirage | le prendre en main ; `Échap` le repose |
| `V` | retourner le carnet (recto ↔ verso) |
| `L` | tout lire à plat, d'une traite |
| `Début` `Fin` | premier / dernier pli |

Deux axes, deux sens : **vertical, on lit ; horizontal, on voyage.** Comme on ne
peut pas descendre plus bas que la fin d'un pli, continuer vers le bas passe au
suivant — on n'a donc jamais besoin de savoir qu'il y a deux axes.

## Écrire

Tout le contenu est dans **`contenu/etapes.js`**, et rien que là. Les étapes,
les coordonnées, les kilométrages et les photos viennent de l'export du voyage,
conservé tel quel dans `medias/source-manovoyage.json`.

**Les récits restent à écrire.** Une page sans récit est une page de tirages, et
elle est finie comme ça — rien n'y signale un manque. Le jour où un `texte`
arrive, les paragraphes apparaissent et les tirages viennent se glisser dedans :

```js
{
  type: 'etape',
  lieu: 'Ayutthaya', jour: 'étape 6', km: 94,
  lat: 14.357, lng: 100.5679,          // sert à tracer le trait
  recto: {
    chapeau: 'Wat Mahathat, Wat Ratchaburana…',   // la ligne sous le titre
    texte: [ 'Un paragraphe.', 'Un autre.' ],     // absent pour l'instant
    photos: [ … ]
  },
  verso: { entete: 'au dos — Ayutthaya', releves: [ … ] }
}
```

Dans les textes, trois balises seulement : `<em>` pour l'italique, `<s>mot</s>`
pour un mot rayé, et `<s>mot</s><span class="corr">?</span>` pour une correction
à la main au-dessus.

Le **dos** de chaque page porte des `releves` — des blocs de lignes en
caractères de machine sur le papier quadrillé. Pour l'instant : la position
relevée, les distances, et l'inventaire des tirages de la page. C'est aussi là
que des notes personnelles auraient leur place, via `notes: [ … ]`.

## Les photos

Les photos sont des **tirages collés dans la page** : marge blanche, coins photo
ou ruban adhésif, légende à la main dessous, quelques degrés de travers. Jamais
une image à fond perdu — ce serait une galerie, pas un carnet.

Les soixante tirages sont dans `medias/`, rangés par étape. Une entrée ressemble
à ça :

```js
{ fichier: 'medias/06-ayutthaya/06-01.jpg',
  legende: 'la tête prise dans les racines',
  angle: -1.7,              // la gîte, en degrés
  pose: 'coins',            // coins photo (défaut) · ruban adhésif
  reference: '06-01',
  apres: 2 }                // si un récit existe : après le 2ᵉ paragraphe
```

Sans `cadrage`, le tirage garde les proportions d'un tirage — 3:4, celles de
toutes les photos du carnet, qui ne sont donc **jamais recadrées**. `cadrage`
vaut `paysage`, `portrait` ou `carre` pour recadrer au centre si un jour des
vues d'un autre format s'ajoutent.

**Tant qu'un fichier manque, le carnet montre l'emplacement du tirage** — du
papier photo non exposé avec sa référence au crayon — et jamais une image
cassée. On peut donc écrire d'abord et coller les photos ensuite.

Un clic sur un tirage le **prend en main** : il se redresse et se rapproche.
Un second clic, `Échap`, ou changer de pli, le repose.

Les sources ne sont posées qu'à l'approche du pli, deux plis d'avance. Soixante
tirages chargés d'un coup, ce serait vingt méga-octets pour des pages qu'on n'a
pas encore dépliées.

## Volontairement absent

Pas de commentaires, pas de partage, pas d'infolettre, pas de bandeau de cookies :
le site ne dépose rien et n'appelle aucun service tiers, à l'exception des polices
Google (avec repli local si elles ne chargent pas). Le seul dessin est le trait de
côte, tracé par le code.

## Lire autrement

- **À plat** (`L`, ou le bouton) : le même carnet en une page verticale, lisible
  d'une traite et imprimable. C'est aussi ce que lisent les moteurs de recherche
  et les synthèses vocales — tout le texte est dans la page, pas fabriqué après coup.
- **Sans JavaScript** : la version à plat s'affiche seule.
- **Sur téléphone** : un pli occupe l'écran, les notes de marge passent sous le texte.
- **Mouvement réduit** : le carnet garde ses plis mais ne glisse plus. Le pliage
  n'est pas un effet, c'est la mise en page — le retirer rendrait le site illisible.

## Les fichiers

```
index.html
contenu/etapes.js     tout le texte — le seul fichier à modifier pour écrire
medias/               les soixante tirages, rangés par étape
medias/source-manovoyage.json   l'export du voyage, tel qu'il est arrivé
scripts/pliage.js     la géométrie de l'accordéon
scripts/trait.js      le tracé de côte, unique et continu
scripts/carnet.js     montage des plis, molette, clavier, faces
styles/carnet.css     le papier
```

Aucune dépendance, aucune compilation, aucun serveur : ouvrir `index.html`
suffit, en local comme en ligne. Pour publier, déposer le dossier tel quel chez
n'importe quel hébergeur de fichiers statiques.

## Comment ça tient debout

Le pliage est calculé, pas imité. On place les **pliures**, pas les panneaux :
elles alternent entre le plan du lecteur et le fond, et cette alternance appartient
au papier — elle est indexée sur le numéro de la pliure, pas sur l'endroit où on
regarde. Le pli qu'on lit est le seul accident : étant à plat, ses deux pliures
sont à la même profondeur, ce qui décale l'alternance d'un cran. Ce décrochement
voyage avec la lecture, et rien d'autre ne bouge.

Chaque panneau reçoit ensuite sa longueur exacte, `Δx = √(L² − Δz²)` : aucun
étirement, aucun trou dans les pliures, aucune dérive en profondeur.
`scripts/pliage.js` fait quatre-vingts lignes et explique le reste.
