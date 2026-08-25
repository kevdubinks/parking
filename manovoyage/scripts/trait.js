/* Le trait — le profil du voyage en latitude, tracé depuis les coordonnées
 * relevées à chaque étape.
 *
 * Un seul dessin, découpé en tranches, une par pli : chaque pli affiche le MÊME
 * chemin SVG avec un viewBox décalé de sa largeur. La ligne traverse donc les
 * pliures sans raccord, et c'est ce qui fait du carnet un objet unique et non
 * une pile de cartes.
 *
 * L'abscisse suit les plis — chaque étape tombe au milieu du sien, si bien que
 * le trait culmine exactement sur la page de Chiang Mai et touche son point bas
 * sur celles d'Andaman. L'ordonnée est la latitude. La ligne n'illustre pas le
 * voyage : elle en est la mesure.
 *
 * Le tremblement est déterministe (générateur à graine) : le trait est le même
 * à chaque chargement, sinon ce ne serait plus un dessin mais une animation.
 */
(function () {
  'use strict';

  function graine(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Chemin lissé : quadratiques passant par les milieux de segments. Donne une
     ligne qui a de la main, sans les angles d'une polyligne. */
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

  function adoucir(t) { return t * t * (3 - 2 * t); }

  /* latitudes : un tableau d'une case par pli. null pour les plis sans
     coordonnée (couverture, fin) : le trait y prolonge la latitude voisine,
     comme une bande de papier qui dépasse du voyage des deux côtés. */
  function construireTrait(latitudes, largeurVolet, hauteur) {
    var n = latitudes.length;
    var rnd = graine(20240902);

    /* Latitude de chaque pli, trous comblés par le voisin le plus proche. */
    var connues = [];
    for (var i = 0; i < n; i++) if (latitudes[i] != null) connues.push(i);
    if (!connues.length) return null;
    var lat = new Array(n);
    for (i = 0; i < n; i++) {
      if (latitudes[i] != null) { lat[i] = latitudes[i]; continue; }
      var proche = connues[0];
      for (var k = 0; k < connues.length; k++) {
        if (Math.abs(connues[k] - i) < Math.abs(proche - i)) proche = connues[k];
      }
      lat[i] = latitudes[proche];
    }

    var min = Math.min.apply(null, lat), max = Math.max.apply(null, lat);
    var etendue = (max - min) || 1;
    var hautY = hauteur * 0.20, basY = hauteur * 0.80;
    function yDe(l) { return basY - (l - min) / etendue * (basY - hautY); }

    /* Abscisse du pli i, au milieu de sa page. */
    function xDe(i) { return (i + 0.5) * largeurVolet; }

    var pts = [];
    var pas = 8;
    var debord = largeurVolet * 0.6;

    /* Avant la première étape : le trait entre dans le carnet, à plat. */
    for (var x = xDe(0) - debord; x < xDe(0); x += pas) {
      pts.push([x, yDe(lat[0]) + (rnd() - 0.5) * 1.4]);
    }
    for (i = 0; i < n - 1; i++) {
      var x0 = xDe(i), x1 = xDe(i + 1);
      var y0 = yDe(lat[i]), y1 = yDe(lat[i + 1]);
      for (x = x0; x < x1; x += pas) {
        var t = adoucir((x - x0) / (x1 - x0));
        pts.push([x, y0 + (y1 - y0) * t + (rnd() - 0.5) * 1.5]);
      }
    }
    for (x = xDe(n - 1); x <= xDe(n - 1) + debord; x += pas) {
      pts.push([x, yDe(lat[n - 1]) + (rnd() - 0.5) * 1.4]);
    }

    /* Deuxième passe décalée : de l'encre qui a bavé, pas une ombre portée. */
    var bis = pts.map(function (p, j) {
      return [p[0] + (j % 3 === 0 ? 0.9 : 0.4), p[1] + 1.3 + Math.sin(j / 7) * 0.5];
    });

    /* Une petite croix au droit de chaque étape, posée sur le trait. */
    var reperes = [];
    for (i = 0; i < n; i++) {
      if (latitudes[i] == null) continue;
      reperes.push({ x: xDe(i), y: yDe(lat[i]) });
    }

    return {
      trace: lisser(pts),
      traceBis: lisser(bis),
      reperes: reperes,
      hauteur: hauteur,
      latMin: min,
      latMax: max
    };
  }

  window.TRAIT = { construireTrait: construireTrait, graine: graine };
})();
