/* Le trait — un seul dessin, découpé en tranches, une par pli.
 *
 * Chaque pli affiche le MÊME chemin SVG, avec un viewBox décalé de sa largeur.
 * Résultat : la ligne traverse les pliures sans raccord. C'est ce qui fait
 * du carnet un objet unique et non une pile de cartes.
 *
 * Tout est déterministe (générateur à graine) : le trait est le même à
 * chaque chargement, sinon ce ne serait plus un dessin mais une animation.
 */
(function () {
  'use strict';

  /* mulberry32 — petit générateur pseudo-aléatoire à graine */
  function graine(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Relief : somme de trois sinusoïdes déphasées + un peu de bruit.
     Assez irrégulier pour ne pas ressembler à une courbe de tableur. */
  function relief(x, phases, echelle) {
    return (
      Math.sin(x / 260 + phases[0]) * 26 +
      Math.sin(x / 97 + phases[1]) * 11 +
      Math.sin(x / 41 + phases[2]) * 4.5
    ) * echelle;
  }

  /* Chemin lissé : quadratiques passant par les milieux de segments.
     Donne une ligne qui a de la main, sans les angles d'une polyligne. */
  function lisser(pts) {
    if (pts.length < 3) return '';
    var d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2;
      var my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ' Q ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) +
           ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    var n = pts.length - 1;
    d += ' L ' + pts[n][0].toFixed(1) + ' ' + pts[n][1].toFixed(1);
    return d;
  }

  /* Construit les trois chemins du dessin.
     largeurTotale = nbVolets × largeurVolet, plus une marge de part et d'autre
     pour que le trait entre et sorte du carnet au lieu de s'y arrêter. */
  function construireTrait(nbVolets, largeurVolet, hauteur) {
    var rnd = graine(20240902);
    var phases = [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283];
    var debord = largeurVolet;
    var x0 = -debord;
    var x1 = nbVolets * largeurVolet + debord;
    var yCote = hauteur * 0.58;

    var cote = [];      // la côte
    var routeHaute = []; // le tracé du voyage : par la terre, au-dessus de l'eau
    var pas = 9;

    for (var x = x0; x <= x1; x += pas) {
      // La côte se creuse par endroits (baies) — un quatrième harmonique lent
      var baie = Math.sin(x / 620 + 1.9);
      var y = yCote + relief(x, phases, 1) + baie * 14;
      y += (rnd() - 0.5) * 1.6;               // tremblement de main
      cote.push([x, y]);

      // La route serpente au-dessus de la côte, s'en écarte, y revient
      var ecart = 34 + Math.sin(x / 310 + 0.6) * 22 + Math.sin(x / 88 + 2.2) * 7;
      routeHaute.push([x, y - Math.abs(ecart) - 4 + (rnd() - 0.5) * 2.2]);
    }

    // Deuxième passe de la côte, décalée : l'encre qui a bavé, pas une ombre
    var coteBis = cote.map(function (p, i) {
      return [p[0] + (i % 3 === 0 ? 0.9 : 0.4), p[1] + 1.35 + Math.sin(i / 7) * 0.5];
    });

    return {
      cote: lisser(cote),
      coteBis: lisser(coteBis),
      route: lisser(routeHaute),
      hauteur: hauteur,
      /* y de la côte au centre d'un pli — sert à poser la croix de l'étape */
      yAu: function (x) {
        var i = Math.round((x - x0) / pas);
        i = Math.max(0, Math.min(cote.length - 1, i));
        return cote[i][1];
      }
    };
  }

  window.TRAIT = { construireTrait: construireTrait, graine: graine };
})();
