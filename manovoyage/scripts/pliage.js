/* Le pliage — géométrie d'un accordéon, calculée, pas mimée.
 *
 * On ne place pas les panneaux, on place les PLIURES : un accordéon est une
 * suite de pliures alternées, les panneaux sont ce qui les relie.
 *
 * Deux choses règlent une pliure.
 *
 * 1. Sa PROFONDEUR. Les pliures alternent entre le plan du lecteur et le fond.
 *    Cette alternance appartient au papier : elle est indexée sur le numéro de
 *    la pliure, pas sur l'endroit où on lit. C'est ce qui manquait à la première
 *    version — en accrochant l'alternance au regard, la bande entière se
 *    dépliait puis se repliait une fois par pli parcouru.
 *
 *    Le pli qu'on lit est le seul accident : il est à plat, donc ses deux
 *    pliures sont à la même profondeur, ce qui casse l'alternance d'un cran.
 *    Ce décrochement se déplace avec la lecture, et rien d'autre ne bouge.
 *
 * 2. Son AMPLITUDE. Près du regard les pliures sont peu marquées, loin elles
 *    se referment jusqu'à 72°. C'est ce qui fait qu'on lit une page à plat avec
 *    le reste du voyage replié de part et d'autre.
 *
 * Le panneau qui relie deux pliures reçoit sa longueur exacte :
 *   Δx = √(L² − Δz²)   et   angle = atan2(Δz, Δx).
 * Aucun étirement, aucun trou dans les pliures, aucune dérive en profondeur.
 */
(function () {
  'use strict';

  var THETA_MAX = 72;   // angle d'une pliure fermée, en degrés
  var PORTEE    = 3;    // sur combien de plis l'ouverture se répartit
  var RAD       = Math.PI / 180;
  var DEG       = 180 / Math.PI;

  /* Ouverture selon la distance au pli lu.
     Exposant < 1 : les voisins immédiats s'ouvrent vite, les lointains restent
     serrés. Sans ça tout est mollement entrouvert et plus rien ne se lit. */
  function angleDe(distance, portee, thetaMax) {
    var t = Math.min(1, distance / portee);
    return thetaMax * Math.pow(t, 0.7);
  }

  /* Marche adoucie, complète sur [−0,5 ; +0,5].
     La largeur compte : au-delà d'un demi-pli, le pli lu ne serait plus
     exactement à plat. En deçà, le passage d'un pli au suivant se voit. */
  function marche(x) {
    var t = Math.min(1, Math.max(0, x + 0.5));
    return t * t * (3 - 2 * t);
  }

  /* Rang d'alternance de la pliure k. Sans le terme de marche, ce serait
     simplement k : une pliure sur deux au fond. La marche retire un rang au-delà
     du pli lu — le décrochement qui met ce pli à plat. */
  function rang(k, position) {
    return k - marche(k - position - 0.5);
  }

  /* Dispose les nb plis pour une position de lecture donnée.
   *   position : flottant. 0 = premier pli lu, 1 = deuxième, etc.
   *
   * Chaque pli reçoit : x, z (px), angle (deg, signé), largeurVue (l'empreinte
   * au sol, L·cos θ) et aplat (1 = face au lecteur, 0 = vu de profil).
   */
  function disposer(nb, largeur, position, options) {
    var o = options || {};
    var thetaMax = o.thetaMax || THETA_MAX;
    var portee = o.portee || PORTEE;

    /* Pliure k = bord gauche du pli k. Il y en a nb + 1. */
    var z = new Array(nb + 1);
    for (var k = 0; k <= nb; k++) {
      var m = Math.abs(k - 0.5 - position);
      var amplitude = largeur * Math.sin(angleDe(m, portee, thetaMax) * RAD);
      var creux = (1 - Math.cos(Math.PI * rang(k, position))) / 2;
      z[k] = -amplitude * creux;
    }

    var plis = new Array(nb);
    var x = 0;
    for (var i = 0; i < nb; i++) {
      var dz = z[i + 1] - z[i];
      var dx = Math.sqrt(Math.max(0, largeur * largeur - dz * dz));

      plis[i] = {
        x: x,
        z: z[i],
        dz: dz,
        angle: Math.atan2(dz, dx) * DEG,
        largeurVue: dx,
        aplat: dx / largeur,
        /* de quel côté la pliure s'enfonce : sert au dégradé d'ombre */
        versFond: dz < 0 ? 1 : -1
      };
      x += dx;
    }

    /* Le pli lu doit rester à profondeur nulle. Sinon la bande respire : un pli
       sur deux serait lu en avant, l'autre en arrière, et la page changerait de
       taille à chaque étape. */
    var iLu = Math.max(0, Math.min(nb - 1, Math.round(position)));
    plis.profondeurLue = plis[iLu].z + (position - iLu + 0.5) * plis[iLu].dz;
    plis.largeurDepliee = x;
    return plis;
  }

  /* Abscisse, sur la bande, du point de lecture.
     u entier = centre du pli u ; u + 0,5 = la pliure suivante. */
  function abscisseDe(plis, u) {
    var i = Math.max(0, Math.min(plis.length - 1, Math.round(u)));
    var p = plis[i];
    return p.x + (u - i + 0.5) * p.largeurVue;
  }

  /* Décalage à appliquer à la bande pour amener ce point à `cadrage` de la
     largeur de l'écran (0,5 = pile au milieu). */
  function recentrer(plis, position, largeurEcran, cadrage) {
    return largeurEcran * (cadrage == null ? 0.5 : cadrage) - abscisseDe(plis, position);
  }

  window.PLIAGE = {
    disposer: disposer,
    recentrer: recentrer,
    abscisseDe: abscisseDe,
    angleDe: angleDe,
    THETA_MAX: THETA_MAX,
    PORTEE: PORTEE
  };
})();
