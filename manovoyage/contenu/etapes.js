/* manovoyage — le contenu du carnet nº 3.
 *
 * Un seul fichier à modifier pour écrire. La mise en page ne se touche pas.
 * Le HTML autorisé dans les textes : <em>, <s>, <br>, <span class="corr">.
 *   <s>mot</s><span class="corr">autre</span>  →  mot rayé, correction au-dessus.
 *
 * Chaque entrée du tableau `volets` est un pli du carnet, de gauche à droite.
 * type : 'couverture' | 'etape' | 'fin'
 */

window.CARNET = {
  titre: 'manovoyage',
  numero: 'carnet nº 3',
  trajet: 'Trieste → Thessalonique, par la côte',
  periode: '2 – 24 septembre',
  tampon: ['SEPTEMBRE', '2 → 24'],
  auteur: 'Mano',

  volets: [

    /* ------------------------------------------------------------------ 0 */
    {
      type: 'couverture',
      recto: {
        exergue: 'On descend la côte en bateau. C’était vrai jusqu’en 2014.',
        lignes: [
          '23 jours',
          '1 665 km au compteur',
          '7 bus de nuit ou d’aube',
          '0 bateau',
          '2 pellicules'
        ],
        pied: 'Se déplie vers la droite. →'
      },
      verso: {
        entete: 'au dos de la couverture',
        notes: [
          'Carnet acheté à Trieste le 2 au matin, papier trop fin, l’encre traverse.',
          'Les pages de droite : ce qui s’est passé.',
          'Les pages de dos : ce que ça a coûté et ce que j’avais noté pour moi.',
          'Si quelque chose est rayé, c’est que je me suis trompé sur le moment. Je n’ai rien réécrit après coup.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 1 */
    {
      type: 'etape',
      lieu: 'Trieste',
      pays: 'Italie',
      jour: 'J1',
      date: '2 septembre',
      km: 0,
      recto: {
        chapeau: 'Le bus ne part pas de la gare routière. Il part du parking derrière.',
        texte: [
          'Il y a bien une gare routière à Trieste, mais les bus qui descendent vers l’est n’en partent pas. Ils partent d’un parking derrière, entre un distributeur de billets hors service et un mur. On m’avait dit d’arriver une heure avant. J’y étais à 8 h 15 pour un départ à 9 h 40. Le type qui vend les billets installe sa table pliante vers 9 h.',
          'J’ai attendu debout, il n’y a nulle part où s’asseoir. Une femme est arrivée avec quatre sacs de courses et un carton fermé au ruban adhésif marron. Elle a demandé si le carton comptait comme un bagage. Le type a dit non. Elle a dit merci trois fois.',
          'La veille j’avais passé la matinée sur le Molo Audace à ne rien faire. Un café à 1,10 au comptoir. Trieste est une ville où on peut rester assis longtemps sans que personne vienne demander si tout va bien.',
          'Je n’avais rien réservé après Rijeka. Ça me paraissait raisonnable à Trieste.'
        ],
        photos: [
          { fichier: 'medias/01-trieste-parking.jpg', apres: 1, angle: -1.7, pose: 'coins',
            reference: 'pell. 1 · 03',
            legende: 'le parking, 8 h 20. la table pliante n’est pas encore là.' }
        ],
        marges: [
          { haut: '30%', cote: 'droite', texte: 'le carton est monté quand même' },
          { haut: '74%', cote: 'gauche', texte: 'ça me paraîtra moins raisonnable jeudi' }
        ],
        piece: {
          type: 'billet',
          angle: -1.6,
          lignes: [
            'ARRIVA / AUTOTRANS',
            'TRIESTE  P.zza Libertà',
            '   →  RIJEKA (HR)',
            '02.09    09:40    posto 14',
            '14,50 EUR   bagaglio incl.'
          ]
        }
      },
      verso: {
        entete: 'au dos — Trieste',
        depenses: [
          ['café, Molo Audace', '1,10'],
          ['billet Trieste → Rijeka', '14,50'],
          ['sandwich, gare', '4,20'],
          ['eau (1,5 L)', '1,00'],
          ['carnet + stylo', '9,80']
        ],
        total: '30,60 €',
        notes: [
          'Le distributeur derrière la gare prend 6 € de frais. Celui de la poste, non.',
          'Ana (chambre à Rijeka) — +385 91 4•• ••7. Sonner deux fois, l’interphone ne marche pas.',
          'Ne plus acheter d’eau en 1,5 L. Trop lourd, et je la finis jamais.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      type: 'etape',
      lieu: 'Rijeka',
      pays: 'Croatie',
      jour: 'J2 – J4',
      date: '3 – 5 septembre',
      km: 85,
      recto: {
        chapeau: 'Il n’y a plus de ferry le long de la côte. Il n’y en a plus depuis 2014.',
        texte: [
          'Je m’étais mis dans la tête qu’on descendait la côte croate en bateau. C’était vrai jusqu’en 2014. La ligne Rijeka – Dubrovnik s’est arrêtée cette année-là et personne ne l’a remplacée. Il reste les ferrys vers les îles, qui vont d’ouest en est et non du nord au sud. Autrement dit ils traversent, ils ne descendent pas.',
          'J’ai mis deux jours à l’accepter. J’ai passé une matinée entière à l’agence du port à poser la même question de trois façons différentes à la même femme, qui m’a donné trois fois la même réponse sans s’énerver.',
          'Rijeka sous la pluie ressemble à une ville industrielle qui a arrêté d’être industrielle sans qu’on lui dise quoi faire ensuite. Les grues du terminal à conteneurs tournent quand même. J’ai dormi trois nuits au-dessus d’un bar, carrelage jusqu’au plafond, une fenêtre sur une cour où quelqu’un réparait un scooter tous les soirs entre 19 h et 21 h.',
          'Le troisième soir j’ai compris qu’il ne le réparait pas. Il le démarrait, l’écoutait, l’arrêtait, et recommençait.'
        ],
        photos: [
          { fichier: 'medias/02-rijeka-cour.jpg', apres: 3, angle: 2.1, pose: 'ruban',
            reference: 'pell. 1 · 14',
            legende: 'la cour, depuis la fenêtre. le scooter est à gauche, hors champ.' }
        ],
        marges: [
          { haut: '38%', cote: 'droite', texte: 'elle s’appelle Vesna. « no boat », avec le sourire de ceux qui l’ont dit mille fois' },
          { haut: '86%', cote: 'gauche', texte: 'je n’ai jamais su ce qu’il écoutait' }
        ],
        piece: {
          type: 'recu',
          angle: 2.1,
          lignes: [
            'KONZUM  RIJEKA — KORZO',
            '04.09.2024        21:14',
            'KRUH POLUBIJELI     1,29',
            'SIR GAUDA 200 G     2,79',
            'PIVO OZUJSKO 0,5    1,19',
            '--------------------------',
            'UKUPNO EUR          5,27'
          ]
        }
      },
      verso: {
        entete: 'au dos — Rijeka',
        depenses: [
          ['chambre, 3 nuits', '66,00'],
          ['courses', '5,27'],
          ['bus urbain ×4', '6,40'],
          ['laverie (annulée, machine pleine)', '0,00'],
          ['bus Rijeka → Zadar', '22,00']
        ],
        total: '99,67 €',
        releve: {
          titre: 'bus Rijeka → Zadar — relevé au guichet',
          lignes: [
            '06:00   4 h 30   direct        22,00',
            '09:15   5 h 50   par Otočac    22,00',
            '12:30   5 h 50   par Otočac    24,50',
            '16:45   4 h 40   direct        24,50',
            '23:59   6 h 10   nuit          19,00'
          ]
        },
        notes: [
          'Prendre le 06:00. C’est le seul du matin qui ne fait pas le détour par l’intérieur.',
          'La Croatie est passée à l’euro en 2023. Les prix sont encore affichés en kunas à côté, en petit, comme un sous-titre.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      type: 'etape',
      lieu: 'Zadar',
      pays: 'Croatie',
      jour: 'J5 – J6',
      date: '6 – 7 septembre',
      km: 315,
      recto: {
        chapeau: 'L’orgue de mer à 6 h 10, et ensuite une laverie.',
        texte: [
          'Tout le monde parle de l’orgue de mer. C’est une série de tuyaux sous le quai : la houle rentre dedans et ça fait des notes. À 18 h il y a deux cents personnes assises sur les marches et on entend surtout les deux cents personnes. À 6 h 10 il n’y a personne, et c’est autre chose.',
          'Le son ne vient pas d’un point, il vient de tout le quai à la fois. Il n’est pas beau. Il est bas et un peu faux, comme un accordéon qu’on ouvre lentement. Ça dure tant qu’il y a de la mer, donc tout le temps.',
          'Le reste de la journée, lessive. Trois heures dans une laverie de la rue <s>Špire</s><span class="corr">?</span> — je ne retrouve plus le nom et je n’ai pas envie d’aller le chercher. Le sèche-linge nº 2 chauffe mal, tout le monde le sait sauf ceux qui viennent d’arriver. Un homme m’a fait non de la tête quand j’ai voulu l’ouvrir. Il ne parlait pas anglais, moi pas croate, on s’est très bien compris.',
          'J’ai relu mes notes des six premiers jours en attendant le cycle. Il n’y a presque rien sur les endroits. Il y a surtout des horaires et des prix.'
        ],
        marges: [
          { haut: '46%', cote: 'droite', texte: 'y retourner à 6 h. pas à 18 h.' },
          { haut: '80%', cote: 'gauche', texte: 'nº 2 = 40 min pour rien' }
        ],
        piece: {
          type: 'billet',
          angle: 1.2,
          lignes: [
            'PRAONICA  —  SAMOPOSLUGA',
            'pranje 8 kg .......... 4,00',
            'sušenje 30 min ....... 3,50',
            'deterdžent ........... 1,00',
            'žeton × 3'
          ]
        }
      },
      verso: {
        entete: 'au dos — Zadar',
        depenses: [
          ['chambre, 2 nuits', '48,00'],
          ['laverie', '8,50'],
          ['café ×5', '7,50'],
          ['bus Zadar → Split', '13,00'],
          ['bus Split → Dubrovnik', '21,00'],
          ['bus Dubrovnik → Kotor', '18,00']
        ],
        total: '116,00 €',
        notes: [
          'Deux frontières entre Dubrovnik et Kotor si on passe par Neum. Trois arrêts, deux tampons, une heure perdue.',
          'Ce que je note : des horaires et des prix. Ce que je photographie : des murs, des sols, des panneaux. Presque personne. Je m’en rends compte en développant.'
        ]
      }
    },


    /* ------------------------------------------------------------ planche */
    {
      type: 'planche',
      titre: 'Pellicule 1',
      pays: '36 vues',
      jalon: ['J1 – J7', 'Trieste, Rijeka, Zadar', 'développée à Split'],
      photos: [
        { fichier: 'medias/p1-01-golfe.jpg', large: true, angle: -0.8, pose: 'coins',
          reference: 'pell. 1 · 01', legende: 'le golfe depuis le Molo Audace, avant tout le reste' },
        { fichier: 'medias/p1-02-quai.jpg', angle: 1.9, pose: 'coins',
          reference: 'pell. 1 · 09', legende: 'le quai de Rijeka, sous la pluie' },
        { fichier: 'medias/p1-03-grues.jpg', angle: -2.2, pose: 'coins',
          reference: 'pell. 1 · 11', legende: 'les grues, qui tournent quand même' },
        { fichier: 'medias/p1-04-carrelage.jpg', angle: 1.3, pose: 'ruban',
          reference: 'pell. 1 · 17', legende: 'le carrelage montait jusqu’au plafond' },
        { fichier: 'medias/p1-05-orgue.jpg', angle: -1.5, pose: 'coins',
          reference: 'pell. 1 · 22', legende: 'l’orgue de mer à 6 h 10. il n’y a rien à voir, c’est le problème.' }
      ],
      verso: {
        entete: 'au dos — pellicule 1',
        dosTirages: [
          '2 sept. — Trieste, Molo Audace',
          '3 sept. — Rijeka, le port',
          '4 sept. — Rijeka, terminal',
          '4 sept. — la chambre',
          '6 sept. — Zadar, 6 h 10'
        ],
        notes: [
          'Développée à Split en une heure, 9 €. Quatre vues perdues au début du rouleau.',
          'La 22 est floue et je l’ai gardée quand même.',
          'Ne plus charger la pellicule en plein soleil.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      type: 'etape',
      lieu: 'Kotor',
      pays: 'Monténégro',
      jour: 'J8 – J10',
      date: '9 – 11 septembre',
      km: 815,
      recto: {
        chapeau: 'À 9 h la ville se remplit, à 17 h elle se vide, à 17 h 10 c’est un village.',
        texte: [
          'Le bateau entre dans la baie au ralenti, plus haut que tout ce qu’il y a autour. À 9 h il pose trois mille personnes sur le quai. Les trois mille font le même circuit, dans le même sens, avec le même autocollant rond sur la poitrine. À 17 h ils repartent. Les rues redeviennent des rues, les chats sortent, et les commerçants qui vendaient des aimants à 14 h dînent dehors à 19 h.',
          'Je ne dis pas ça de haut. J’ai fait exactement le même circuit, dans le même sens, le premier jour, parce qu’entre les murs c’est le seul chemin possible.',
          'Je suis monté au fort Saint-Jean à 6 h 20 pour éviter la chaleur. Ce sont mille trois cent cinquante marches, plus ou moins ; personne ne compte pareil. Mon genou droit a tenu à la montée. À la descente, non. J’ai mis une heure vingt pour redescendre ce que j’avais monté en cinquante minutes, à reculons dans les passages raides, ce qui est ridicule à voir et efficace.',
          'J’avais payé les 15 € la première fois, à 14 h, avec le soleil sur la nuque. Le deuxième matin, à 6 h 20, il n’y avait personne pour vendre quoi que ce soit.'
        ],
        photos: [
          { fichier: 'medias/03-kotor-marches.jpg', apres: 3, angle: -2.4, cadrage: 'portrait',
            pose: 'coins', reference: 'pell. 2 · 07',
            legende: 'les marches, vers la neuf centième. je m’étais assis.' }
        ],
        marges: [
          { haut: '34%', cote: 'droite', texte: 'compter les autocollants : bleus le matin, jaunes l’après-midi. deux bateaux.' },
          { haut: '82%', cote: 'gauche', texte: 'acheter une genouillère à Shkodër' }
        ],
        piece: {
          type: 'billet',
          angle: -2.4,
          lignes: [
            'TVRĐAVA SV. IVAN  /  KOTOR',
            'ULAZNICA — ADMISSION',
            'nº 0 4 1 7 7 3',
            '09 / 09        15,00 EUR',
            'ne vrijedi za povratak'
          ]
        }
      },
      verso: {
        entete: 'au dos — Kotor',
        depenses: [
          ['chambre, 3 nuits (Dobrota)', '75,00'],
          ['forteresse', '15,00'],
          ['bus local Dobrota ↔ Kotor ×6', '6,00'],
          ['pharmacie — bande + ibuprofène', '7,40'],
          ['restaurant, une fois', '19,00'],
          ['bus Kotor → Shkodër', '14,00']
        ],
        total: '136,40 €',
        notes: [
          'Le Monténégro paie en euros sans être dans l’euro. Personne sur place ne trouve ça remarquable.',
          'Dormir à Dobrota et pas dans les murs : moitié prix, vingt minutes à pied le long de l’eau, et on entend la ville sans être dedans.',
          'Genouillère : pas achetée. Je l’écris pour la troisième fois.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      type: 'etape',
      lieu: 'Shkodër',
      pays: 'Albanie',
      jour: 'J13 – J15',
      date: '14 – 16 septembre',
      km: 945,
      recto: {
        chapeau: 'Le passage de la frontière a duré quarante minutes pour huit personnes.',
        texte: [
          'Le poste de Hani i Hotit : deux cabanes et un auvent. Le bus s’arrête, tout le monde descend avec son passeport, on attend. Il n’y a pas de file, il y a un groupe. Quarante minutes pour huit personnes. Personne ne s’énerve, ce qui devrait me servir de leçon et ne me sert jamais de leçon.',
          'Shkodër se fait à vélo. J’en ai loué un 500 lekë la journée dans une cour, sans papier, sans caution ; le type a juste donné son prénom — Dritan — comme si ça suffisait. Ça a suffi. La roue arrière était voilée. Je l’ai ramené le soir en m’excusant : il l’a mise dans l’étau, il a serré trois rayons, il a refusé l’argent que je voulais ajouter, et il a été un peu vexé que je propose.',
          'Le lac est à quatre kilomètres. La route longe des maisons en construction, des fers à béton qui dépassent du dernier étage. On m’a expliqué que ce n’est pas de l’abandon, c’est de l’attente : tant que la maison n’est pas finie, on peut ajouter un étage pour le fils.',
          'Trois personnes différentes m’ont fait cette réponse, dans les mêmes termes. Je ne sais pas si c’est vrai ou si c’est ce qu’on dit aux étrangers qui demandent.'
        ],
        photos: [
          { fichier: 'medias/04-shkoder-velo.jpg', apres: 2, angle: 1.6, pose: 'ruban',
            reference: 'pell. 2 · 19',
            legende: 'le vélo de Dritan, roue arrière redressée. il n’a pas voulu être dessus.' }
        ],
        marges: [
          { haut: '42%', cote: 'droite', texte: '500 lekë ≈ 4,80 €. j’ai mis deux jours à arrêter de convertir.' },
          { haut: '88%', cote: 'gauche', texte: 'vérifier l’histoire des fers à béton' }
        ],
        piece: {
          type: 'recu',
          angle: 1.8,
          lignes: [
            'QIRA BIÇIKLETE — 1 DITË',
            'rr. Kolë Idromeno',
            '16.09           500 LEKË',
            '(pa dokument)',
            'Dritan'
          ]
        }
      },
      verso: {
        entete: 'au dos — Shkodër',
        depenses: [
          ['chambre, 3 nuits', '2 700 lekë'],
          ['vélo, 2 jours', '1 000 lekë'],
          ['byrek ×5', '500 lekë'],
          ['café ×9', '810 lekë'],
          ['bus → Sarandë (via Tirana)', '2 200 lekë']
        ],
        total: '7 210 lekë ≈ 69 €',
        notes: [
          'Retirer au distributeur de la Credins, pas à celui de l’hôtel : 0 % contre 4,5 %.',
          'Les cafés se paient en partant, pas en arrivant. Deux fois j’ai voulu payer d’avance, deux fois on m’a fait signe de m’asseoir.',
          'Le bus pour Tirana n’a pas d’horaire. Il part plein. Arriver tôt ne sert à rien, arriver tard non plus.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      type: 'etape',
      lieu: 'Sarandë',
      pays: 'Albanie',
      jour: 'J18 – J19',
      date: '19 – 20 septembre',
      km: 1235,
      recto: {
        chapeau: 'J’ai payé 1 000 lekë pour voir des pierres et je n’ai rien senti.',
        texte: [
          'Butrint est à dix-huit kilomètres. C’est classé, il y a un théâtre grec, une basilique, un baptistère avec une mosaïque qu’on ne peut pas voir parce qu’on la recouvre de sable pour la protéger. J’ai marché deux heures et demie là-dedans. Je n’ai rien senti. Ce n’est pas la faute de Butrint.',
          'Il y a un nombre de choses qu’on peut regarder par jour. Le mien tourne autour de deux. Au-delà, ça glisse. Au dix-huitième jour je regardais des ruines comme on regarde un couloir.',
          'Sarandë monte en escalier au-dessus de sa baie et la moitié des immeubles n’ont pas de fenêtres. Le soir, ceux qui sont finis s’allument et on voit exactement lesquels.',
          'Le ferry pour Corfou part à 10 h 30. Corfou est à vingt kilomètres, on la voit depuis la terrasse, tout le temps, ce qui est pénible. Je n’y suis pas allé. Je n’ai pas de bonne raison.'
        ],
        photos: [
          { fichier: 'medias/05-sarande-fenetres.jpg', apres: 3, angle: -1.2, pose: 'coins',
            reference: 'pell. 2 · 26',
            legende: 'le soir. on voit lesquels sont finis.' }
        ],
        marges: [
          { haut: '36%', cote: 'droite', texte: 'la mosaïque est sous le sable depuis 2010. on ne verra rien.' },
          { haut: '90%', cote: 'gauche', texte: '25 € l’aller-retour. ce n’est pas une question d’argent.' }
        ],
        piece: {
          type: 'billet',
          angle: -1.1,
          lignes: [
            'PARKU KOMBËTAR I BUTRINTIT',
            'BILETË / TICKET',
            '19.09.2024     10:41',
            '1000 LEKË      nr. 118402',
            'ruaje biletën'
          ]
        }
      },
      verso: {
        entete: 'au dos — Sarandë',
        depenses: [
          ['chambre, 2 nuits', '3 400 lekë'],
          ['Butrint, entrée', '1 000 lekë'],
          ['bus n° 14 aller-retour', '600 lekë'],
          ['poisson, une fois', '1 800 lekë'],
          ['bus de nuit → Thessalonique', '4 500 lekë']
        ],
        total: '11 300 lekë ≈ 108 €',
        releve: {
          titre: 'bus de nuit Sarandë → Thessalonique',
          lignes: [
            'départ annoncé      19:30',
            'départ réel         20:10',
            'arrêt Gjirokastër   22:05  (25 min)',
            'frontière Kakavijë  00:40  (55 min)',
            'arrivée annoncée    06:30',
            'arrivée réelle      04:50'
          ]
        },
        notes: [
          'Un bus en avance est pire qu’un bus en retard.',
          'Garder la monnaie en lekë : elle ne se rechange nulle part passé la frontière.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      type: 'etape',
      lieu: 'Thessalonique',
      pays: 'Grèce',
      jour: 'J23',
      date: '24 septembre',
      km: 1665,
      recto: {
        chapeau: 'Le bus arrive à 4 h 50 dans une gare qui est à cinq kilomètres de tout.',
        texte: [
          'On m’avait promis 6 h 30. Le bus a fait mieux, ce qui n’est pas un service à rendre à quelqu’un. La gare routière est un bâtiment posé sur un rond-point, ouvert, éclairé au néon, avec un café qui sert à toute heure parce que quelqu’un a compris que les bus arrivent à toute heure.',
          'J’ai attendu deux heures qu’il fasse jour, un café grec et un croissant sous plastique. Nous étions cinq. Personne ne parlait. C’est le moment du voyage dont je me souviens le mieux et il n’y a rien à en dire.',
          'Ensuite le bus jusqu’au centre, la mer à gauche, la tour blanche, Ladadika. Vingt-trois jours, mille six cent soixante-cinq kilomètres au compteur plus ce que je n’ai pas compté, sept bus de nuit ou d’aube, et aucun bateau — alors que c’était toute l’idée du départ.',
          'Je suis entré dans un magasin et j’ai acheté une chemise, parce que tout ce que j’avais sentait la même chose.'
        ],
        photos: [
          { fichier: 'medias/06-thessalonique-gare.jpg', apres: 2, angle: 2.0, pose: 'ruban',
            reference: 'pell. 2 · 34',
            legende: '5 h 06. nous étions cinq et personne ne parlait.' }
        ],
        marges: [
          { haut: '58%', cote: 'droite', texte: 'le café de la gare routière : 1,80. le même à Ladadika : 4,20.' },
          { haut: '92%', cote: 'gauche', texte: 'chemise 12,90. bleue. je la porte encore.' }
        ],
        piece: {
          type: 'recu',
          angle: 2.6,
          lignes: [
            'ΚΤΕΛ  ΜΑΚΕΔΟΝΙΑ',
            'ΚΑΦΕΣ ΕΛΛΗΝΙΚΟΣ     1,80',
            'ΚΡΟΥΑΣΑΝ            1,40',
            '24/09      05:06',
            'ΣΥΝΟΛΟ EUR          3,20'
          ]
        }
      },
      verso: {
        entete: 'au dos — Thessalonique',
        depenses: [
          ['café + croissant, 4 h 50', '3,20'],
          ['bus centre-ville', '1,10'],
          ['chemise', '12,90'],
          ['chambre, 1 nuit', '34,00'],
          ['train retour (plus tard)', '—']
        ],
        total: '51,20 €',
        releve: {
          titre: 'le compte, en gros',
          lignes: [
            'transports               298 €',
            'chambres                 412 €',
            'nourriture               236 €',
            'entrées, musées           49 €',
            'le reste                  74 €',
            '-----------------------------',
            '23 jours              1 069 €',
            'par jour                46,50 €'
          ]
        },
        notes: [
          'Ce que j’ai le mieux dépensé : les nuits à Dobrota et le vélo de Dritan.',
          'Ce que j’ai le plus mal dépensé : Butrint, et les 6 € de frais du distributeur de Trieste.'
        ]
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      type: 'fin',
      recto: {
        exergue: 'Fin du carnet nº 3.',
        lignes: [
          'Écrit sur place, au stylo, dans sept bus et une gare routière.',
          'Recopié ici sans être arrangé.',
          'Les tirages ont été collés au retour, dans le désordre, puis remis dans l’ordre.',
          'Le trait qui traverse les plis est le tracé de la côte, du golfe de Trieste au golfe Thermaïque. Il ne s’interrompt jamais, même dans les pliures.'
        ],
        pied: 'Carnet nº 4 : par le train, vers le nord. Un jour.'
      },
      verso: {
        entete: 'au dos de la fin',
        notes: [
          'Pour écrire à Mano : le carnet se replie, l’adresse est dessous.',
          'Ce site tient dans six fichiers et ne dépose aucun cookie.',
          'Il n’y a pas de commentaires. Il n’y a pas de partage. Il n’y a pas de newsletter.',
          'Les récits sont ceux d’un voyage. Les prix sont ceux de septembre. Les deux vieilliront.'
        ]
      }
    }

  ]
};
