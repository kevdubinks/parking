/* manovoyage — le contenu du carnet.
 *
 * Étapes, coordonnées, kilométrages et photos viennent de l'export du voyage,
 * conservé tel quel dans `medias/source-manovoyage.json`.
 *
 * Les légendes décrivent ce qu'on voit sur le tirage. Le récit de chaque étape
 * reste à écrire : ajouter un tableau `texte` à `recto` et les paragraphes
 * apparaissent, les tirages venant alors se glisser dedans. Tant qu'il n'y en
 * a pas, la page est une page de tirages — et elle est finie comme ça.
 *
 * HTML autorisé dans les textes : <em>, <s>, <br>, <span class="corr">.
 */

window.CARNET = {
  titre: 'manovoyage',
  numero: 'Thaïlande',
  trajet: 'Bangkok \u2192 Ayutthaya \u2192 Chiang Mai \u2192 Krabi',
  tampon: ['8\u00b0 N', '19\u00b0 N'],
  auteur: 'Mano',

  volets: [

    {
      type: 'couverture',
      recto: {
        exergue: 'Quinze étapes, du Chao Phraya aux karsts d\u2019Andaman.',
        lignes: ['15 étapes', '2\u202f044 km', '60 tirages', 'du 8\u1d49 au 19\u1d49 parallèle'],
        pied: 'Se déplie vers la droite. \u2192'
      },
      verso: {
        entete: 'au dos de la couverture',
        notes: [
          'Les pages de droite : les tirages, dans l\u2019ordre du voyage.',
          'Les pages de dos : la position relevée, et l\u2019inventaire des tirages de la page.',
          'Le trait qui traverse les plis est le profil du voyage en latitude. Il monte jusqu\u2019à Chiang Mai et redescend jusqu\u2019à la mer d\u2019Andaman. Il est tracé depuis les coordonnées relevées, et ne s\u2019interrompt jamais, même dans les pliures.'
        ]
      }
    },

    /* ------------------------------------------------------------ étape 1 */
    {
      type: 'etape',
      lieu: 'Wat Pho',
      pays: 'Thaïlande',
      jour: 'étape 1',
      km: 0,
      lat: 13.7465, lng: 100.4927,
      recto: {
        chapeau: 'Bangkok, rive est du Chao Phraya.',
        photos: [
          { fichier: 'medias/01-wat-pho/01-01.jpg', legende: 'le bouddha couché, et les offrandes à sa tête',
            angle: -1.7, pose: 'coins', reference: '01-01' }
        ]
      },
      verso: {
        entete: 'au dos — Wat Pho',
        releves: [
        { titre: 'relevé', lignes: [
          'position        13,7465 N   100,4927 E',
          'depuis l\u2019étape précédente   0 km',
          'depuis le départ            0 km',
          'tirages sur cette page      1'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '01-01   le bouddha couché, et les offrandes à sa tête'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 2 */
    {
      type: 'etape',
      lieu: 'Wat Arun',
      pays: 'Thaïlande',
      jour: 'étape 2',
      km: 1,
      lat: 13.7437, lng: 100.4889,
      recto: {
        chapeau: 'Le prang, de jour puis à la tombée du soir.',
        photos: [
          { fichier: 'medias/02-wat-arun/02-01.jpg', legende: 'le prang éclairé, depuis l’autre rive',
            angle: -1.7, pose: 'coins', reference: '02-01' },
          { fichier: 'medias/02-wat-arun/02-02.jpg', legende: 'de face, depuis le pied',
            angle: 2.1, pose: 'coins', reference: '02-02' },
          { fichier: 'medias/02-wat-arun/02-03.jpg', legende: 'les marches, prises d’en bas',
            angle: -1.2, pose: 'ruban', reference: '02-03' },
          { fichier: 'medias/02-wat-arun/02-04.jpg', legende: 'le prang principal et ses satellites',
            angle: 1.6, pose: 'coins', reference: '02-04' },
          { fichier: 'medias/02-wat-arun/02-05.jpg', legende: 'l’allée d’entrée, côté jardin',
            angle: -2.4, pose: 'coins', reference: '02-05' },
          { fichier: 'medias/02-wat-arun/02-06.jpg', legende: 'l’ubosot, toits superposés',
            angle: 1.3, pose: 'ruban', reference: '02-06' }
        ]
      },
      verso: {
        entete: 'au dos — Wat Arun',
        releves: [
        { titre: 'relevé', lignes: [
          'position        13,7437 N   100,4889 E',
          'depuis l\u2019étape précédente   1 km',
          'depuis le départ            1 km',
          'tirages sur cette page      6'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '02-01   le prang éclairé, depuis l’autre rive',
          '02-02   de face, depuis le pied',
          '02-03   les marches, prises d’en bas',
          '02-04   le prang principal et ses satellites',
          '02-05   l’allée d’entrée, côté jardin',
          '02-06   l’ubosot, toits superposés'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 3 */
    {
      type: 'etape',
      lieu: 'Talat Noi',
      pays: 'Thaïlande',
      jour: 'étape 3',
      km: 4,
      lat: 13.7375, lng: 100.5115,
      recto: {
        chapeau: 'Baan So Heng Tai, Baan Rim Naam, les murs peints.',
        photos: [
          { fichier: 'medias/03-talat-noi/03-01.jpg', legende: 'une porte rouge, et ce qui pousse devant',
            angle: -1.7, pose: 'coins', reference: '03-01' },
          { fichier: 'medias/03-talat-noi/03-02.jpg', legende: 'le vélo devant l’atelier',
            angle: 2.1, pose: 'coins', reference: '03-02' },
          { fichier: 'medias/03-talat-noi/03-03.jpg', legende: 'l’horloge et le carrelage en damier',
            angle: -1.2, pose: 'ruban', reference: '03-03' },
          { fichier: 'medias/03-talat-noi/03-04.jpg', legende: 'les murs peints, ruelle',
            angle: 1.6, pose: 'coins', reference: '03-04' },
          { fichier: 'medias/03-talat-noi/03-05.jpg', legende: 'la fresque, et les motos garées dessous',
            angle: -2.4, pose: 'coins', reference: '03-05' },
          { fichier: 'medias/03-talat-noi/03-06.jpg', legende: 'la voiture, laissée là',
            angle: 1.3, pose: 'ruban', reference: '03-06' },
          { fichier: 'medias/03-talat-noi/03-07.jpg', legende: 'la façade jaune',
            angle: -0.9, pose: 'coins', reference: '03-07' }
        ]
      },
      verso: {
        entete: 'au dos — Talat Noi',
        releves: [
        { titre: 'relevé', lignes: [
          'position        13,7375 N   100,5115 E',
          'depuis l\u2019étape précédente   3 km',
          'depuis le départ            4 km',
          'tirages sur cette page      7'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '03-01   une porte rouge, et ce qui pousse devant',
          '03-02   le vélo devant l’atelier',
          '03-03   l’horloge et le carrelage en damier',
          '03-04   les murs peints, ruelle',
          '03-05   la fresque, et les motos garées dessous',
          '03-06   la voiture, laissée là',
          '03-07   la façade jaune'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 4 */
    {
      type: 'etape',
      lieu: 'Yaowarat',
      pays: 'Thaïlande',
      jour: 'étape 4',
      km: 5,
      lat: 13.7398, lng: 100.5106,
      recto: {
        chapeau: 'Chinatown, la nuit.',
        photos: [
          { fichier: 'medias/04-yaowarat/04-01.jpg', legende: 'Yaowarat, vers l’ouest',
            angle: -1.7, pose: 'coins', reference: '04-01' },
          { fichier: 'medias/04-yaowarat/04-02.jpg', legende: 'les enseignes, de près',
            angle: 2.1, pose: 'coins', reference: '04-02' },
          { fichier: 'medias/04-yaowarat/04-03.jpg', legende: 'au-dessus de la rue',
            angle: -1.2, pose: 'ruban', reference: '04-03' }
        ]
      },
      verso: {
        entete: 'au dos — Yaowarat',
        releves: [
        { titre: 'relevé', lignes: [
          'position        13,7398 N   100,5106 E',
          'depuis l\u2019étape précédente   1 km',
          'depuis le départ            5 km',
          'tirages sur cette page      3'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '04-01   Yaowarat, vers l’ouest',
          '04-02   les enseignes, de près',
          '04-03   au-dessus de la rue'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 5 */
    {
      type: 'etape',
      lieu: 'Wat Paknam',
      pays: 'Thaïlande',
      jour: 'étape 5',
      km: 14,
      lat: 13.7178, lng: 100.4685,
      recto: {
        chapeau: 'Le grand Bouddha de Phasi Charoen.',
        photos: [
          { fichier: 'medias/05-wat-paknam/05-01.jpg', legende: 'le grand bouddha, de face',
            angle: -1.7, pose: 'coins', reference: '05-01' },
          { fichier: 'medias/05-wat-paknam/05-02.jpg', legende: 'depuis le parvis',
            angle: 2.1, pose: 'coins', reference: '05-02' },
          { fichier: 'medias/05-wat-paknam/05-03.jpg', legende: 'à travers les arbres',
            angle: -1.2, pose: 'ruban', reference: '05-03' },
          { fichier: 'medias/05-wat-paknam/05-04.jpg', legende: 'depuis le khlong, les barques au premier plan',
            angle: 1.6, pose: 'coins', reference: '05-04' }
        ]
      },
      verso: {
        entete: 'au dos — Wat Paknam',
        releves: [
        { titre: 'relevé', lignes: [
          'position        13,7178 N   100,4685 E',
          'depuis l\u2019étape précédente   9 km',
          'depuis le départ            14 km',
          'tirages sur cette page      4'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '05-01   le grand bouddha, de face',
          '05-02   depuis le parvis',
          '05-03   à travers les arbres',
          '05-04   depuis le khlong, les barques au premier plan'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 6 */
    {
      type: 'etape',
      lieu: 'Ayutthaya',
      pays: 'Thaïlande',
      jour: 'étape 6',
      km: 94,
      lat: 14.357, lng: 100.5679,
      recto: {
        chapeau: 'Wat Mahathat, Wat Ratchaburana, Wat Chaiwatthanaram, Wat Thammikarat.',
        photos: [
          { fichier: 'medias/06-ayutthaya/06-01.jpg', legende: 'la tête prise dans les racines',
            angle: -1.7, pose: 'coins', reference: '06-01' },
          { fichier: 'medias/06-ayutthaya/06-02.jpg', legende: 'le prang central',
            angle: 2.1, pose: 'coins', reference: '06-02' },
          { fichier: 'medias/06-ayutthaya/06-03.jpg', legende: 'un bouddha assis, de face',
            angle: -1.2, pose: 'ruban', reference: '06-03' },
          { fichier: 'medias/06-ayutthaya/06-04.jpg', legende: 'l’alignement, ce qu’il en reste',
            angle: 1.6, pose: 'coins', reference: '06-04' },
          { fichier: 'medias/06-ayutthaya/06-05.jpg', legende: 'les marches, entre deux murs',
            angle: -2.4, pose: 'coins', reference: '06-05' },
          { fichier: 'medias/06-ayutthaya/06-06.jpg', legende: 'le passage',
            angle: 1.3, pose: 'ruban', reference: '06-06' },
          { fichier: 'medias/06-ayutthaya/06-07.jpg', legende: 'le chedi, sous les arbres',
            angle: -0.9, pose: 'coins', reference: '06-07' },
          { fichier: 'medias/06-ayutthaya/06-08.jpg', legende: 'le chedi et la galerie',
            angle: 2.6, pose: 'coins', reference: '06-08' },
          { fichier: 'medias/06-ayutthaya/06-09.jpg', legende: 'l’étoffe jaune sur l’épaule',
            angle: -1.5, pose: 'ruban', reference: '06-09' },
          { fichier: 'medias/06-ayutthaya/06-10.jpg', legende: 'le prang, niche est',
            angle: 1.9, pose: 'coins', reference: '06-10' },
          { fichier: 'medias/06-ayutthaya/06-11.jpg', legende: 'le prang, encadré par la porte',
            angle: -2.1, pose: 'coins', reference: '06-11' },
          { fichier: 'medias/06-ayutthaya/06-12.jpg', legende: 'la même porte, plus près',
            angle: 1.1, pose: 'ruban', reference: '06-12' }
        ]
      },
      verso: {
        entete: 'au dos — Ayutthaya',
        releves: [
        { titre: 'relevé', lignes: [
          'position        14,3570 N   100,5679 E',
          'depuis l\u2019étape précédente   80 km',
          'depuis le départ            94 km',
          'tirages sur cette page      12'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '06-01   la tête prise dans les racines',
          '06-02   le prang central',
          '06-03   un bouddha assis, de face',
          '06-04   l’alignement, ce qu’il en reste',
          '06-05   les marches, entre deux murs',
          '06-06   le passage',
          '06-07   le chedi, sous les arbres',
          '06-08   le chedi et la galerie',
          '06-09   l’étoffe jaune sur l’épaule',
          '06-10   le prang, niche est',
          '06-11   le prang, encadré par la porte',
          '06-12   la même porte, plus près'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 7 */
    {
      type: 'etape',
      lieu: 'Marché flottant d\'Ayothaya',
      pays: 'Thaïlande',
      jour: 'étape 7',
      km: 100,
      lat: 14.3536, lng: 100.6018,
      recto: {
        chapeau: 'En barque, puis les pontons de bambou.',
        photos: [
          { fichier: 'medias/07-marche-flottant-d-ayothaya/07-01.jpg', legende: 'depuis la barque',
            angle: -1.7, pose: 'coins', reference: '07-01' },
          { fichier: 'medias/07-marche-flottant-d-ayothaya/07-02.jpg', legende: 'les pontons de bambou',
            angle: 2.1, pose: 'coins', reference: '07-02' }
        ]
      },
      verso: {
        entete: 'au dos — Marché flottant d\'Ayothaya',
        releves: [
        { titre: 'relevé', lignes: [
          'position        14,3536 N   100,6018 E',
          'depuis l\u2019étape précédente   6 km',
          'depuis le départ            100 km',
          'tirages sur cette page      2'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '07-01   depuis la barque',
          '07-02   les pontons de bambou'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 8 */
    {
      type: 'etape',
      lieu: 'Ayutthaya la nuit',
      pays: 'Thaïlande',
      jour: 'étape 8',
      km: 106,
      lat: 14.357, lng: 100.5679,
      recto: {
        chapeau: 'Les mêmes ruines, éclairées.',
        photos: [
          { fichier: 'medias/08-ayutthaya-la-nuit/08-01.jpg', legende: 'les deux prangs, éclairés',
            angle: -1.7, pose: 'coins', reference: '08-01' },
          { fichier: 'medias/08-ayutthaya-la-nuit/08-02.jpg', legende: 'le prang, à la nuit',
            angle: 2.1, pose: 'coins', reference: '08-02' },
          { fichier: 'medias/08-ayutthaya-la-nuit/08-03.jpg', legende: 'la porte, éclairée',
            angle: -1.2, pose: 'ruban', reference: '08-03' }
        ]
      },
      verso: {
        entete: 'au dos — Ayutthaya la nuit',
        releves: [
        { titre: 'relevé', lignes: [
          'position        14,3570 N   100,5679 E',
          'depuis l\u2019étape précédente   6 km',
          'depuis le départ            106 km',
          'tirages sur cette page      3'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '08-01   les deux prangs, éclairés',
          '08-02   le prang, à la nuit',
          '08-03   la porte, éclairée'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 9 */
    {
      type: 'etape',
      lieu: 'Wat Sri Suphan',
      pays: 'Thaïlande',
      jour: 'étape 9',
      km: 696,
      lat: 18.7793, lng: 98.9836,
      recto: {
        chapeau: 'Le temple d’argent, Chiang Mai.',
        photos: [
          { fichier: 'medias/09-wat-sri-suphan/09-01.jpg', legende: 'l’entrée, tout en argent repoussé',
            angle: -1.7, pose: 'coins', reference: '09-01' },
          { fichier: 'medias/09-wat-sri-suphan/09-02.jpg', legende: 'le bouddha d’argent',
            angle: 2.1, pose: 'coins', reference: '09-02' },
          { fichier: 'medias/09-wat-sri-suphan/09-03.jpg', legende: 'l’or contre l’argent',
            angle: -1.2, pose: 'ruban', reference: '09-03' }
        ]
      },
      verso: {
        entete: 'au dos — Wat Sri Suphan',
        releves: [
        { titre: 'relevé', lignes: [
          'position        18,7793 N   98,9836 E',
          'depuis l\u2019étape précédente   590 km',
          'depuis le départ            696 km',
          'tirages sur cette page      3'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '09-01   l’entrée, tout en argent repoussé',
          '09-02   le bouddha d’argent',
          '09-03   l’or contre l’argent'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 10 */
    {
      type: 'etape',
      lieu: 'Chiang Mai',
      pays: 'Thaïlande',
      jour: 'étape 10',
      km: 698,
      lat: 18.79, lng: 98.9877,
      recto: {
        chapeau: 'Wat Inthakhin Sadue Muang, les lanternes, la place des Trois Rois.',
        photos: [
          { fichier: 'medias/10-chiang-mai/10-01.jpg', legende: 'les lanternes, en rangs',
            angle: -1.7, pose: 'coins', reference: '10-01' },
          { fichier: 'medias/10-chiang-mai/10-02.jpg', legende: 'les lanternes de papier, le soir',
            angle: 2.1, pose: 'coins', reference: '10-02' },
          { fichier: 'medias/10-chiang-mai/10-03.jpg', legende: 'un visage de pierre, sous l’auvent',
            angle: -1.2, pose: 'ruban', reference: '10-03' },
          { fichier: 'medias/10-chiang-mai/10-04.jpg', legende: 'les couleurs, de près',
            angle: 1.6, pose: 'coins', reference: '10-04' },
          { fichier: 'medias/10-chiang-mai/10-05.jpg', legende: 'les nagas, la nuit',
            angle: -2.4, pose: 'coins', reference: '10-05' },
          { fichier: 'medias/10-chiang-mai/10-06.jpg', legende: 'la passerelle, vers le wat',
            angle: 1.3, pose: 'ruban', reference: '10-06' }
        ]
      },
      verso: {
        entete: 'au dos — Chiang Mai',
        releves: [
        { titre: 'relevé', lignes: [
          'position        18,7900 N   98,9877 E',
          'depuis l\u2019étape précédente   2 km',
          'depuis le départ            698 km',
          'tirages sur cette page      6'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '10-01   les lanternes, en rangs',
          '10-02   les lanternes de papier, le soir',
          '10-03   un visage de pierre, sous l’auvent',
          '10-04   les couleurs, de près',
          '10-05   les nagas, la nuit',
          '10-06   la passerelle, vers le wat'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 11 */
    {
      type: 'etape',
      lieu: 'Krabi',
      pays: 'Thaïlande',
      jour: 'étape 11',
      km: 1858,
      lat: 8.1489, lng: 98.86,
      recto: {
        chapeau: 'Wat Bang Thong.',
        photos: [
          { fichier: 'medias/11-krabi/11-01.jpg', legende: 'Wat Bang Thong, sous la colline',
            angle: -1.7, pose: 'coins', reference: '11-01' }
        ]
      },
      verso: {
        entete: 'au dos — Krabi',
        releves: [
        { titre: 'relevé', lignes: [
          'position        8,1489 N   98,8600 E',
          'depuis l\u2019étape précédente   1 160 km',
          'depuis le départ            1 858 km',
          'tirages sur cette page      1'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '11-01   Wat Bang Thong, sous la colline'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 12 */
    {
      type: 'etape',
      lieu: 'Khlong Thom',
      pays: 'Thaïlande',
      jour: 'étape 12',
      km: 1920,
      lat: 7.9247, lng: 99.2716,
      recto: {
        chapeau: 'Emerald Pool, Crystal Pool, sources chaudes.',
        photos: [
          { fichier: 'medias/12-khlong-thom/12-01.jpg', legende: 'le bassin, l’eau verte',
            angle: -1.7, pose: 'coins', reference: '12-01' },
          { fichier: 'medias/12-khlong-thom/12-02.jpg', legende: 'l’Emerald Pool',
            angle: 2.1, pose: 'coins', reference: '12-02' },
          { fichier: 'medias/12-khlong-thom/12-03.jpg', legende: 'les panneaux, au bord',
            angle: -1.2, pose: 'ruban', reference: '12-03' },
          { fichier: 'medias/12-khlong-thom/12-04.jpg', legende: 'les racines en contreforts',
            angle: 1.6, pose: 'coins', reference: '12-04' },
          { fichier: 'medias/12-khlong-thom/12-05.jpg', legende: 'les sources chaudes, le ressaut',
            angle: -2.4, pose: 'coins', reference: '12-05' }
        ]
      },
      verso: {
        entete: 'au dos — Khlong Thom',
        releves: [
        { titre: 'relevé', lignes: [
          'position        7,9247 N   99,2716 E',
          'depuis l\u2019étape précédente   62 km',
          'depuis le départ            1 920 km',
          'tirages sur cette page      5'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '12-01   le bassin, l’eau verte',
          '12-02   l’Emerald Pool',
          '12-03   les panneaux, au bord',
          '12-04   les racines en contreforts',
          '12-05   les sources chaudes, le ressaut'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 13 */
    {
      type: 'etape',
      lieu: 'Ao Thalane',
      pays: 'Thaïlande',
      jour: 'étape 13',
      km: 1996,
      lat: 8.1653, lng: 98.7739,
      recto: {
        chapeau: 'Mangrove, karsts.',
        photos: [
          { fichier: 'medias/13-ao-thalane/13-01.jpg', legende: 'la mangrove',
            angle: -1.7, pose: 'coins', reference: '13-01' },
          { fichier: 'medias/13-ao-thalane/13-02.jpg', legende: 'les karsts, depuis l’eau',
            angle: 2.1, pose: 'coins', reference: '13-02' }
        ]
      },
      verso: {
        entete: 'au dos — Ao Thalane',
        releves: [
        { titre: 'relevé', lignes: [
          'position        8,1653 N   98,7739 E',
          'depuis l\u2019étape précédente   76 km',
          'depuis le départ            1 996 km',
          'tirages sur cette page      2'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '13-01   la mangrove',
          '13-02   les karsts, depuis l’eau'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 14 */
    {
      type: 'etape',
      lieu: 'Koh Kai',
      pays: 'Thaïlande',
      jour: 'étape 14',
      km: 2038,
      lat: 8.0177, lng: 98.7508,
      recto: {
        chapeau: 'L’île au Poulet.',
        photos: [
          { fichier: 'medias/14-koh-kai/14-01.jpg', legende: 'l’île au Poulet, de loin',
            angle: -1.7, pose: 'coins', reference: '14-01' },
          { fichier: 'medias/14-koh-kai/14-02.jpg', legende: 'de plus près, depuis la barque',
            angle: 2.1, pose: 'coins', reference: '14-02' }
        ]
      },
      verso: {
        entete: 'au dos — Koh Kai',
        releves: [
        { titre: 'relevé', lignes: [
          'position        8,0177 N   98,7508 E',
          'depuis l\u2019étape précédente   42 km',
          'depuis le départ            2 038 km',
          'tirages sur cette page      2'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '14-01   l’île au Poulet, de loin',
          '14-02   de plus près, depuis la barque'
        ] }
        ]
      }
    },

    /* ------------------------------------------------------------ étape 15 */
    {
      type: 'etape',
      lieu: 'Railay',
      pays: 'Thaïlande',
      jour: 'étape 15',
      km: 2044,
      lat: 8.0072, lng: 98.8375,
      recto: {
        chapeau: 'Phra Nang, les grottes.',
        photos: [
          { fichier: 'medias/15-railay/15-01.jpg', legende: 'Phra Nang, sous le surplomb',
            angle: -1.7, pose: 'coins', reference: '15-01' },
          { fichier: 'medias/15-railay/15-02.jpg', legende: 'l’entrée de la grotte',
            angle: 2.1, pose: 'coins', reference: '15-02' },
          { fichier: 'medias/15-railay/15-03.jpg', legende: 'la paroi, pour l’échelle',
            angle: -1.2, pose: 'ruban', reference: '15-03' }
        ]
      },
      verso: {
        entete: 'au dos — Railay',
        releves: [
        { titre: 'relevé', lignes: [
          'position        8,0072 N   98,8375 E',
          'depuis l\u2019étape précédente   6 km',
          'depuis le départ            2 044 km',
          'tirages sur cette page      3'
        ] },
        { titre: 'les tirages de cette page', lignes: [
          '15-01   Phra Nang, sous le surplomb',
          '15-02   l’entrée de la grotte',
          '15-03   la paroi, pour l’échelle'
        ] }
        ]
      }
    },

    /* ---------------------------------------------------------------- fin */
    {
      type: 'fin',
      recto: {
        exergue: 'Fin du carnet.',
        lignes: [
          'Soixante tirages, collés dans l\u2019ordre du voyage.',
          'Les légendes disent ce qu\u2019on voit. Les récits restent à écrire : chaque page en attend un.',
          'Le trait est le profil du voyage en latitude, tracé depuis les coordonnées relevées.',
          'Aucun cookie, aucun compte, aucun service tiers.'
        ],
        pied: 'Revenir au début : touche Début. \u2190'
      },
      verso: {
        entete: 'au dos de la fin',
        releves: [
          { titre: 'le compte', lignes: [
            'étapes                      15',
            'tirages                     60',
            'distance              2\u202f044 km',
            'latitude     7,92 N  \u2192  18,79 N',
            'longitude   98,75 E  \u2192  100,60 E'
          ] }
        ]
      }
    }

  ]
};
