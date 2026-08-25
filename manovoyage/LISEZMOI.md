# manovoyage

Un carnet de voyage qui se **déplie**.

Le site n'est pas une suite d'articles : c'est une seule bande de papier pliée en
accordéon. On avance dedans latéralement, le pli qu'on lit est à plat, et le reste
du voyage est replié de part et d'autre — visiblement, physiquement. L'épaisseur
des plis à gauche et à droite dit combien de chemin il reste de chaque côté.

Chaque pli a un **dos**. Le recto porte le récit ; le verso, sur papier quadrillé,
porte ce que ça a coûté, les horaires de bus relevés au guichet, les notes qu'on
se prend pour soi. Touche `V`, ou le bouton « voir le dos ».

Un **trait unique** — le tracé de la côte, du golfe de Trieste au golfe Thermaïque —
traverse les neuf plis sans jamais s'interrompre, y compris dans les pliures.
C'est ce qui fait que le carnet est un objet et non neuf cartes posées côte à côte.

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

Tout le contenu est dans **`contenu/etapes.js`**, et rien que là. C'est le seul
fichier à ouvrir pour écrire. Ajouter une étape = ajouter une entrée dans le
tableau `volets` ; le pliage, le trait et la mise en page suivent tout seuls,
quel que soit le nombre de plis.

Une étape ressemble à ça :

```js
{
  type: 'etape',
  lieu: 'Rijeka', pays: 'Croatie', jour: 'J2 – J4', date: '3 – 5 septembre', km: 85,
  recto: {
    chapeau: 'La phrase qui ouvre le pli.',
    texte: [ 'Un paragraphe.', 'Un autre.' ],
    marges: [ { haut: '38%', cote: 'droite', texte: 'note ajoutée après coup' } ],
    piece:  { type: 'billet', angle: -1.6, lignes: ['…', '…'] }   // ticket collé
  },
  verso: {
    entete: 'dos du pli 2 — Rijeka',
    depenses: [ ['chambre, 3 nuits', '66,00'] ], total: '99,67 €',
    releve:   { titre: 'relevé au guichet', lignes: ['06:00  4 h 30  direct'] },
    notes:    [ 'ce qu on note pour soi' ]
  }
}
```

Dans les textes, trois balises seulement :
`<em>` pour l'italique, `<s>mot</s>` pour un mot rayé, et
`<s>mot</s><span class="corr">?</span>` pour une correction à la main au-dessus.

`piece.type` vaut `billet` ou `recu`. `marges[].cote` (`droite` / `gauche`) ne
change que l'inclinaison de la note ; toutes s'écrivent dans la marge de droite.

## Les photos

Les photos sont des **tirages collés dans la page** : marge blanche, coins photo
ou ruban adhésif, légende à la main dessous, et quelques degrés de travers.
Jamais une image à fond perdu — ce serait une galerie, pas un carnet.

Déposer les fichiers dans `medias/` (voir `medias/LISEZMOI.md` pour les tailles),
puis les citer dans `contenu/etapes.js` :

```js
photos: [
  { fichier: 'medias/03-kotor-marches.jpg',
    legende: 'les marches, vers la neuf centième. je m’étais assis.',
    apres: 3,               // se glisse après le 3ᵉ paragraphe ; sinon à la fin
    cadrage: 'portrait',    // paysage (défaut) · portrait · carre
    pose: 'coins',          // coins photo (défaut) · ruban adhésif
    angle: -2.4,            // la gîte, en degrés
    reference: 'pell. 2 · 07' }
]
```

**Tant qu'un fichier n'est pas là, le carnet montre l'emplacement du tirage** —
du papier photo non exposé avec sa référence au crayon — et jamais une image
cassée. On peut donc écrire d'abord et coller les photos ensuite.

Un clic sur un tirage le **prend en main** : il se redresse et se rapproche.
Un second clic, `Échap`, ou changer de pli, le repose.

### Une page de planche

Un pli entier peut être une planche — les tirages d'une pellicule collés
ensemble. `type: 'planche'`, avec `titre`, `jalon` et un tableau `photos`
(ajouter `large: true` à celle qui ouvre la page). Au dos, `dosTirages` écrit ce
qu'on note derrière un tirage :

```js
dosTirages: ['2 sept. — Trieste, Molo Audace', '3 sept. — Rijeka, le port']
```

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
medias/               les photos, déposées telles quelles
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
