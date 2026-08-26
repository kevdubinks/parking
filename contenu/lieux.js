/* manovoyage — les lieux.
 *
 * Étapes, coordonnées, kilométrages et photos viennent de l'export du voyage,
 * conservé tel quel dans `medias/source-manovoyage.json`.
 *
 * Les légendes décrivent ce qu'on voit sur la photo. Les textes de ville
 * parlent des lieux eux-mêmes — leur histoire, ce qu'on y voit — et non du
 * voyage de quelqu'un : ces souvenirs-là ne sont pas les miens à écrire.
 * `mot` est ce qui s'écrit au dos de la carte postale ; `histoire` est le texte
 * long de la section Découverte.
 *
 * La vignette d'une photo se déduit de son nom : medias/vignettes/<ref>.jpg.
 * Les grilles et les marqueurs n'affichent que celles-là ; la photo pleine
 * taille n'est chargée qu'à l'ouverture de la carte postale.
 */

window.LIEUX = {
  voyage: 'manovoyage',
  pays: 'Thaïlande',
  distance: 2044,
  villes: [

    {
      id: 'bangkok', nom: 'Bangkok', sous: 'Krung Thep',
      lat: 13.7398, lng: 100.5106,
      mot: 'On arrive par le fleuve, c’est la seule façon qui ait du sens. Le Chao Phraya coupe la ville en deux et tout s’organise autour : les temples sur une rive, les bateaux-bus qui ne s’arrêtent jamais tout à fait, l’eau brune et tiède. À Wat Pho, le bouddha couché fait quarante-six mètres et il est doré jusque sous la plante des pieds. Le soir, Yaowarat s’allume d’un coup et la ville change de température.',
      histoire: [
        'Bangkok tient sur un delta. La ville a été bâtie sur des canaux — les khlongs — dont il ne reste qu’une partie, comblés au fil du siècle pour faire des avenues. Le fleuve, lui, est resté le vrai axe : c’est encore par lui qu’on se déplace le plus vite aux heures de pointe.',
        'Sur la rive est, Wat Pho est l’un des plus anciens temples de la ville et l’un des plus vastes. On y voit le bouddha couché, mais aussi ce qui passe pour la première université du pays : les galeries portent des planches gravées de médecine et de massage traditionnels, mises là pour que le savoir ne se perde pas.',
        'En face, Wat Arun dresse un prang couvert de porcelaine — des éclats de vaisselle chinoise, servant de lest aux bateaux marchands, incrustés par milliers dans le mortier. Les marches sont raides, et elles le sont exprès.',
        'Plus au sud, Talat Noi garde ses ateliers de pièces détachées, ses maisons sino-thaïes et ses murs peints. Et Yaowarat, le soir venu, ne ressemble à aucune autre rue.'
      ],
      sites: [
        {
          nom: 'Wat Pho', texte: 'Bangkok, rive est du Chao Phraya.',
          lat: 13.7465, lng: 100.4927, km: 0,
          photos: [
            { fichier: 'medias/01-wat-pho/01-01.jpg', legende: 'le bouddha couché, et les offrandes à sa tête', ref: '01-01' }
          ]
        },
        {
          nom: 'Wat Arun', texte: 'Le prang, de jour puis à la tombée du soir.',
          lat: 13.7437, lng: 100.4889, km: 1,
          photos: [
            { fichier: 'medias/02-wat-arun/02-01.jpg', legende: 'le prang éclairé, depuis l’autre rive', ref: '02-01' },
            { fichier: 'medias/02-wat-arun/02-02.jpg', legende: 'de face, depuis le pied', ref: '02-02' },
            { fichier: 'medias/02-wat-arun/02-03.jpg', legende: 'les marches, prises d’en bas', ref: '02-03' },
            { fichier: 'medias/02-wat-arun/02-04.jpg', legende: 'le prang principal et ses satellites', ref: '02-04' },
            { fichier: 'medias/02-wat-arun/02-05.jpg', legende: 'l’allée d’entrée, côté jardin', ref: '02-05' },
            { fichier: 'medias/02-wat-arun/02-06.jpg', legende: 'l’ubosot, toits superposés', ref: '02-06' }
          ]
        },
        {
          nom: 'Talat Noi', texte: 'Baan So Heng Tai, Baan Rim Naam, les murs peints.',
          lat: 13.7375, lng: 100.5115, km: 4,
          photos: [
            { fichier: 'medias/03-talat-noi/03-01.jpg', legende: 'une porte rouge, et ce qui pousse devant', ref: '03-01' },
            { fichier: 'medias/03-talat-noi/03-02.jpg', legende: 'le vélo devant l’atelier', ref: '03-02' },
            { fichier: 'medias/03-talat-noi/03-03.jpg', legende: 'l’horloge et le carrelage en damier', ref: '03-03' },
            { fichier: 'medias/03-talat-noi/03-04.jpg', legende: 'les murs peints, ruelle', ref: '03-04' },
            { fichier: 'medias/03-talat-noi/03-05.jpg', legende: 'la fresque, et les motos garées dessous', ref: '03-05' },
            { fichier: 'medias/03-talat-noi/03-06.jpg', legende: 'la voiture, laissée là', ref: '03-06' },
            { fichier: 'medias/03-talat-noi/03-07.jpg', legende: 'la façade jaune', ref: '03-07' }
          ]
        },
        {
          nom: 'Yaowarat', texte: 'Chinatown, la nuit.',
          lat: 13.7398, lng: 100.5106, km: 5,
          photos: [
            { fichier: 'medias/04-yaowarat/04-01.jpg', legende: 'Yaowarat, vers l’ouest', ref: '04-01' },
            { fichier: 'medias/04-yaowarat/04-02.jpg', legende: 'les enseignes, de près', ref: '04-02' },
            { fichier: 'medias/04-yaowarat/04-03.jpg', legende: 'au-dessus de la rue', ref: '04-03' }
          ]
        },
        {
          nom: 'Wat Paknam', texte: 'Le grand Bouddha de Phasi Charoen.',
          lat: 13.7178, lng: 100.4685, km: 14,
          photos: [
            { fichier: 'medias/05-wat-paknam/05-01.jpg', legende: 'le grand bouddha, de face', ref: '05-01' },
            { fichier: 'medias/05-wat-paknam/05-02.jpg', legende: 'depuis le parvis', ref: '05-02' },
            { fichier: 'medias/05-wat-paknam/05-03.jpg', legende: 'à travers les arbres', ref: '05-03' },
            { fichier: 'medias/05-wat-paknam/05-04.jpg', legende: 'depuis le khlong, les barques au premier plan', ref: '05-04' }
          ]
        }
      ]
    },

    {
      id: 'ayutthaya', nom: 'Ayutthaya', sous: 'Phra Nakhon Si Ayutthaya',
      lat: 14.3557, lng: 100.579,
      mot: 'Quatre-vingts kilomètres au nord de Bangkok, une île entre trois rivières. Ayutthaya a été la capitale du Siam pendant quatre siècles et l’un des plus grands ports d’Asie, avant d’être brûlée en 1767. Il en reste des briques, des prangs, des files de bouddhas sans tête — et cette tête-là, prise dans les racines d’un figuier, que personne n’a jamais voulu dégager.',
      histoire: [
        'Ayutthaya a été fondée vers 1350 sur une île formée par la rencontre de trois rivières. Pendant quatre cents ans elle a été la capitale du Siam et l’un des grands ports d’Asie : des comptoirs portugais, hollandais, français et japonais, et une population qu’on a estimée à un million d’habitants au XVIIᵉ siècle — quand Londres n’en comptait pas la moitié.',
        'En 1767, l’armée birmane la prend et la brûle. La cour se replie vers le sud et fonde Bangkok. Ayutthaya n’a jamais été rebâtie : c’est pour cette raison qu’elle est encore là.',
        'À Wat Mahathat, une tête de bouddha en grès s’est retrouvée au sol après le sac, et un figuier a poussé autour. Elle est aujourd’hui à hauteur de genou, ce qui oblige à s’accroupir pour la regarder — on ne se tient pas plus haut qu’elle, et les gardiens y veillent.',
        'Wat Chaiwatthanaram, sur l’autre rive, a été bâti en 1630 dans le style khmer. À la nuit tombée, on l’éclaire, et les briques passent à l’orange.'
      ],
      sites: [
        {
          nom: 'Ayutthaya', texte: 'Wat Mahathat, Wat Ratchaburana, Wat Chaiwatthanaram, Wat Thammikarat.',
          lat: 14.357, lng: 100.5679, km: 94,
          photos: [
            { fichier: 'medias/06-ayutthaya/06-01.jpg', legende: 'la tête prise dans les racines', ref: '06-01' },
            { fichier: 'medias/06-ayutthaya/06-02.jpg', legende: 'le prang central', ref: '06-02' },
            { fichier: 'medias/06-ayutthaya/06-03.jpg', legende: 'un bouddha assis, de face', ref: '06-03' },
            { fichier: 'medias/06-ayutthaya/06-04.jpg', legende: 'l’alignement, ce qu’il en reste', ref: '06-04' },
            { fichier: 'medias/06-ayutthaya/06-05.jpg', legende: 'les marches, entre deux murs', ref: '06-05' },
            { fichier: 'medias/06-ayutthaya/06-06.jpg', legende: 'le passage', ref: '06-06' },
            { fichier: 'medias/06-ayutthaya/06-07.jpg', legende: 'le chedi, sous les arbres', ref: '06-07' },
            { fichier: 'medias/06-ayutthaya/06-08.jpg', legende: 'le chedi et la galerie', ref: '06-08' },
            { fichier: 'medias/06-ayutthaya/06-09.jpg', legende: 'l’étoffe jaune sur l’épaule', ref: '06-09' },
            { fichier: 'medias/06-ayutthaya/06-10.jpg', legende: 'le prang, niche est', ref: '06-10' },
            { fichier: 'medias/06-ayutthaya/06-11.jpg', legende: 'le prang, encadré par la porte', ref: '06-11' },
            { fichier: 'medias/06-ayutthaya/06-12.jpg', legende: 'la même porte, plus près', ref: '06-12' }
          ]
        },
        {
          nom: 'Marché flottant d\'Ayothaya', texte: 'En barque, puis les pontons de bambou.',
          lat: 14.3536, lng: 100.6018, km: 100,
          photos: [
            { fichier: 'medias/07-marche-flottant-d-ayothaya/07-01.jpg', legende: 'depuis la barque', ref: '07-01' },
            { fichier: 'medias/07-marche-flottant-d-ayothaya/07-02.jpg', legende: 'les pontons de bambou', ref: '07-02' }
          ]
        },
        {
          nom: 'Ayutthaya la nuit', texte: 'Les mêmes ruines, éclairées.',
          lat: 14.357, lng: 100.5679, km: 106,
          photos: [
            { fichier: 'medias/08-ayutthaya-la-nuit/08-01.jpg', legende: 'les deux prangs, éclairés', ref: '08-01' },
            { fichier: 'medias/08-ayutthaya-la-nuit/08-02.jpg', legende: 'le prang, à la nuit', ref: '08-02' },
            { fichier: 'medias/08-ayutthaya-la-nuit/08-03.jpg', legende: 'la porte, éclairée', ref: '08-03' }
          ]
        }
      ]
    },

    {
      id: 'chiang-mai', nom: 'Chiang Mai', sous: 'capitale du Lanna',
      lat: 18.7847, lng: 98.9857,
      mot: 'Sept cents kilomètres plus au nord, et l’air change. Chiang Mai a été la capitale du royaume de Lanna, et elle en a gardé la forme : un carré de douves d’un kilomètre et demi de côté, avec ce qui reste des remparts aux angles. Au sud, dans le quartier des orfèvres, un temple entièrement recouvert d’argent martelé. Et partout, des lanternes de papier.',
      histoire: [
        'Chiang Mai a été fondée en 1296 par le roi Mangrai, comme capitale du Lanna — un royaume resté distinct du Siam pendant des siècles, avec sa langue, son écriture et son architecture. La vieille ville tient toujours dans son carré de douves.',
        'Au centre, Wat Inthakhin Sadue Muang marque le nombril de la ville : c’est là que le pilier de la cité a été planté à la fondation, avant d’être déplacé à Wat Chedi Luang vers 1800. Le temple est à quelques pas du monument des Trois Rois.',
        'Au sud des douves, la rue Wua Lai est celle des orfèvres depuis deux siècles. Wat Sri Suphan y a vu son ubosot recouvert de plaques d’argent et d’aluminium repoussées à la main, un travail entrepris dans les années 2000 et jamais tout à fait fini — les motifs bouddhiques traditionnels y côtoient des scènes bien plus inattendues.',
        'Les lanternes, elles, se fabriquent toute l’année. On les accroche par centaines, et de près on voit le papier, les baguettes de bambou et la colle.'
      ],
      sites: [
        {
          nom: 'Wat Sri Suphan', texte: 'Le temple d’argent, Chiang Mai.',
          lat: 18.7793, lng: 98.9836, km: 696,
          photos: [
            { fichier: 'medias/09-wat-sri-suphan/09-01.jpg', legende: 'l’entrée, tout en argent repoussé', ref: '09-01' },
            { fichier: 'medias/09-wat-sri-suphan/09-02.jpg', legende: 'le bouddha d’argent', ref: '09-02' },
            { fichier: 'medias/09-wat-sri-suphan/09-03.jpg', legende: 'l’or contre l’argent', ref: '09-03' }
          ]
        },
        {
          nom: 'Chiang Mai', texte: 'Wat Inthakhin Sadue Muang, les lanternes, la place des Trois Rois.',
          lat: 18.79, lng: 98.9877, km: 698,
          photos: [
            { fichier: 'medias/10-chiang-mai/10-01.jpg', legende: 'les lanternes, en rangs', ref: '10-01' },
            { fichier: 'medias/10-chiang-mai/10-02.jpg', legende: 'les lanternes de papier, le soir', ref: '10-02' },
            { fichier: 'medias/10-chiang-mai/10-03.jpg', legende: 'un visage de pierre, sous l’auvent', ref: '10-03' },
            { fichier: 'medias/10-chiang-mai/10-04.jpg', legende: 'les couleurs, de près', ref: '10-04' },
            { fichier: 'medias/10-chiang-mai/10-05.jpg', legende: 'les nagas, la nuit', ref: '10-05' },
            { fichier: 'medias/10-chiang-mai/10-06.jpg', legende: 'la passerelle, vers le wat', ref: '10-06' }
          ]
        }
      ]
    },

    {
      id: 'krabi', nom: 'Krabi', sous: 'mer d’Andaman',
      lat: 8.07, lng: 98.85,
      mot: 'Tout au sud, la mer d’Andaman. Le calcaire sort de l’eau en blocs verticaux couverts de forêt : ce sont les restes d’un récif vieux de quelque deux cent cinquante millions d’années, que la pluie et la mer ont creusé par en dessous. À Railay, on n’arrive qu’en bateau — aucune route n’y mène. Dans les terres, une source sort à une trentaine de degrés et descend jusqu’à une rivière froide.',
      histoire: [
        'La province de Krabi tient sur du calcaire. Ce qui monte à la verticale au-dessus de l’eau et de la forêt, ce sont les vestiges d’un récif corallien formé il y a quelque deux cent cinquante millions d’années, soulevé puis dissous par la pluie. Le résultat : des falaises, des grottes, et des îlots qui ne tiennent presque plus — comme Koh Kai, dont le sommet a pris la forme d’une tête de poule.',
        'À Ao Thalane, la mangrove pousse au pied des karsts. On la traverse en kayak à marée haute ; à marée basse on voit les racines nues, et un sol qui bouge.',
        'Dans les terres, à Khlong Thom, une source thermale descend en vasques taillées dans la roche jusqu’à une rivière froide. Un peu plus loin, l’Emerald Pool est un bassin d’eau claire que le fond calcaire rend vert — la couleur change avec l’heure et avec la pluie de la veille.',
        'Railay est une presqu’île que ses falaises coupent de la terre ferme. On y débarque à Phra Nang, sous un surplomb, et on comprend tout de suite pourquoi il n’y a pas de route.'
      ],
      sites: [
        {
          nom: 'Krabi', texte: 'Wat Bang Thong.',
          lat: 8.1489, lng: 98.86, km: 1858,
          photos: [
            { fichier: 'medias/11-krabi/11-01.jpg', legende: 'Wat Bang Thong, sous la colline', ref: '11-01' }
          ]
        },
        {
          nom: 'Khlong Thom', texte: 'Emerald Pool, Crystal Pool, sources chaudes.',
          lat: 7.9247, lng: 99.2716, km: 1920,
          photos: [
            { fichier: 'medias/12-khlong-thom/12-01.jpg', legende: 'le bassin, l’eau verte', ref: '12-01' },
            { fichier: 'medias/12-khlong-thom/12-02.jpg', legende: 'l’Emerald Pool', ref: '12-02' },
            { fichier: 'medias/12-khlong-thom/12-03.jpg', legende: 'les panneaux, au bord', ref: '12-03' },
            { fichier: 'medias/12-khlong-thom/12-04.jpg', legende: 'les racines en contreforts', ref: '12-04' },
            { fichier: 'medias/12-khlong-thom/12-05.jpg', legende: 'les sources chaudes, le ressaut', ref: '12-05' }
          ]
        },
        {
          nom: 'Ao Thalane', texte: 'Mangrove, karsts.',
          lat: 8.1653, lng: 98.7739, km: 1996,
          photos: [
            { fichier: 'medias/13-ao-thalane/13-01.jpg', legende: 'la mangrove', ref: '13-01' },
            { fichier: 'medias/13-ao-thalane/13-02.jpg', legende: 'les karsts, depuis l’eau', ref: '13-02' }
          ]
        },
        {
          nom: 'Koh Kai', texte: 'L’île au Poulet.',
          lat: 8.0177, lng: 98.7508, km: 2038,
          photos: [
            { fichier: 'medias/14-koh-kai/14-01.jpg', legende: 'l’île au Poulet, de loin', ref: '14-01' },
            { fichier: 'medias/14-koh-kai/14-02.jpg', legende: 'de plus près, depuis la barque', ref: '14-02' }
          ]
        },
        {
          nom: 'Railay', texte: 'Phra Nang, les grottes.',
          lat: 8.0072, lng: 98.8375, km: 2044,
          photos: [
            { fichier: 'medias/15-railay/15-01.jpg', legende: 'Phra Nang, sous le surplomb', ref: '15-01' },
            { fichier: 'medias/15-railay/15-02.jpg', legende: 'l’entrée de la grotte', ref: '15-02' },
            { fichier: 'medias/15-railay/15-03.jpg', legende: 'la paroi, pour l’échelle', ref: '15-03' }
          ]
        }
      ]
    },
  ]
};
