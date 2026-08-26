/* Le globe — projection orthographique, dessinée au canvas.
 *
 * Orthographique veut dire : la Terre vue de très loin, comme depuis un hublot
 * assez haut pour que la courbure se voie. On ne montre jamais qu'un hémisphère,
 * ce qui est exactement ce qu'on veut — le reste est derrière.
 *
 * Le point de vue est (lambda, phi). Il est TOUJOURS au centre de l'écran :
 * descendre sur une ville, c'est amener ses coordonnées là et grandir le rayon.
 * D'où l'impression de descente, sans qu'aucune caméra n'existe vraiment.
 */
(function () {
  'use strict';

  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  var RAYON_TERRE = 6371;                  // km
  var SEUIL_REGION = 2600;                 // px : au-delà, les côtes fines

  function creer(canvas) {
    var ctx = canvas.getContext('2d');
    var g = {
      lambda: 100, phi: 14,                // point de vue, en degrés
      R: 260,                              // rayon à l'écran, en pixels
      largeur: 0, hauteur: 0, cx: 0, cy: 0,
      /* Le centre optique est un peu au-dessus du milieu : le bas de l'écran
         est occupé par les panneaux, et une planète centrée y paraît basse. */
      ancrageY: 0.46
    };

    g.dimensionner = function () {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      g.largeur = canvas.clientWidth;
      g.hauteur = canvas.clientHeight;
      canvas.width = Math.round(g.largeur * d);
      canvas.height = Math.round(g.hauteur * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      g.cx = g.largeur / 2;
      g.cy = g.hauteur * g.ancrageY;
    };

    /* Projection. `devant` dit si le point est sur l'hémisphère visible. */
    g.projeter = function (lon, lat) {
      var l = (lon - g.lambda) * RAD, p = lat * RAD, p0 = g.phi * RAD;
      var sp = Math.sin(p), cp = Math.cos(p), sl = Math.sin(l), cl = Math.cos(l);
      var s0 = Math.sin(p0), c0 = Math.cos(p0);
      return {
        x: g.cx + g.R * cp * sl,
        y: g.cy - g.R * (c0 * sp - s0 * cp * cl),
        devant: (s0 * sp + c0 * cp * cl) >= 0
      };
    };

    /* Rayon apparent de la Terre à l'écran, en kilomètres par pixel. */
    g.kmParPixel = function () { return RAYON_TERRE / g.R; };

    /* Altitude de survol : la moitié de ce que l'écran embrasse. Ce n'est pas
       une mesure d'aéronautique, c'est une lecture honnête du zoom. */
    g.altitude = function () {
      return (g.largeur / 2) * g.kmParPixel() * 1.15;
    };

    /* Faire glisser le globe. Le facteur suit le rayon : près du sol, un même
       geste doit parcourir moins de degrés, sinon la Terre file sous les doigts. */
    g.tourner = function (dx, dy) {
      var k = 90 / g.R;
      g.lambda -= dx * k / Math.max(0.25, Math.cos(g.phi * RAD));
      g.phi = Math.max(-85, Math.min(85, g.phi + dy * k));
      if (g.lambda > 180) g.lambda -= 360;
      if (g.lambda < -180) g.lambda += 360;
    };

    /* ------------------------------------------------------------ dessin */

    function chemin(anneaux) {
      ctx.beginPath();
      for (var a = 0; a < anneaux.length; a++) {
        var r = anneaux[a], ouvert = false;
        for (var i = 0; i < r.length; i += 2) {
          var p = g.projeter(r[i] / 100, r[i + 1] / 100);
          if (!p.devant) {
            /* Le contour passe derrière : on referme ici et on reprendra
               de l'autre côté. La découpe circulaire cache la corde. */
            if (ouvert) { ctx.closePath(); ouvert = false; }
            continue;
          }
          if (!ouvert) { ctx.moveTo(p.x, p.y); ouvert = true; }
          else ctx.lineTo(p.x, p.y);
        }
        if (ouvert) ctx.closePath();
      }
    }

    function paralleles() {
      ctx.beginPath();
      var lat, lon, p, ouvert;
      for (lat = -60; lat <= 60; lat += 30) {
        ouvert = false;
        for (lon = -180; lon <= 180; lon += 4) {
          p = g.projeter(lon, lat);
          if (!p.devant) { ouvert = false; continue; }
          if (!ouvert) { ctx.moveTo(p.x, p.y); ouvert = true; } else ctx.lineTo(p.x, p.y);
        }
      }
      for (lon = -180; lon < 180; lon += 30) {
        ouvert = false;
        for (lat = -88; lat <= 88; lat += 4) {
          p = g.projeter(lon, lat);
          if (!p.devant) { ouvert = false; continue; }
          if (!ouvert) { ctx.moveTo(p.x, p.y); ouvert = true; } else ctx.lineTo(p.x, p.y);
        }
      }
    }

    g.dessiner = function (couleurs) {
      var c = couleurs;
      ctx.clearRect(0, 0, g.largeur, g.hauteur);

      /* L'atmosphère : un halo au-delà du limbe. C'est lui qui fait qu'on
         regarde une planète et non un disque découpé. */
      var halo = ctx.createRadialGradient(g.cx, g.cy, g.R * 0.97, g.cx, g.cy, g.R * 1.16);
      halo.addColorStop(0, c.halo);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.R * 1.16, 0, 6.2832);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.R, 0, 6.2832);
      ctx.clip();

      /* L'océan, éclairé en haut à gauche : sans ce dégradé la sphère est plate. */
      var mer = ctx.createRadialGradient(
        g.cx - g.R * 0.34, g.cy - g.R * 0.38, g.R * 0.05,
        g.cx, g.cy, g.R * 1.05);
      mer.addColorStop(0, c.merClaire);
      mer.addColorStop(1, c.merSombre);
      ctx.fillStyle = mer;
      ctx.fillRect(g.cx - g.R, g.cy - g.R, g.R * 2, g.R * 2);

      ctx.lineWidth = 1;
      ctx.strokeStyle = c.grille;
      paralleles();
      ctx.stroke();

      var fines = g.R > SEUIL_REGION && window.TERRE.region;
      chemin(fines ? window.TERRE.region : window.TERRE.monde);
      ctx.fillStyle = c.terre;
      ctx.fill('evenodd');
      ctx.strokeStyle = c.cote;
      ctx.lineWidth = fines ? 1.1 : 0.9;
      ctx.stroke();

      /* Assombrir le bord : la lumière tombe vers le limbe. */
      var ombre = ctx.createRadialGradient(g.cx, g.cy, g.R * 0.55, g.cx, g.cy, g.R);
      ombre.addColorStop(0, 'rgba(0,0,0,0)');
      ombre.addColorStop(1, c.limbe);
      ctx.fillStyle = ombre;
      ctx.fillRect(g.cx - g.R, g.cy - g.R, g.R * 2, g.R * 2);
      ctx.restore();

      ctx.strokeStyle = c.horizon;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.R, 0, 6.2832);
      ctx.stroke();
    };

    /* Le trajet, en arcs de grand cercle. Sur quelques degrés c'est presque une
       droite, mais la formule reste juste si un autre voyage s'ajoute un jour. */
    g.tracerRoute = function (points, couleur, epaisseur) {
      if (points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.R, 0, 6.2832);
      ctx.clip();
      ctx.strokeStyle = couleur;
      ctx.lineWidth = epaisseur;
      ctx.lineCap = 'round';
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      for (var i = 0; i < points.length - 1; i++) {
        var a = points[i], b = points[i + 1], ouvert = false;
        for (var t = 0; t <= 1.0001; t += 0.02) {
          var q = interpoler(a, b, t);
          var p = g.projeter(q[0], q[1]);
          if (!p.devant) { ouvert = false; continue; }
          if (!ouvert) { ctx.moveTo(p.x, p.y); ouvert = true; } else ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    return g;
  }

  /* Interpolation sphérique entre deux points géographiques. */
  function interpoler(a, b, t) {
    var p1 = a[1] * RAD, l1 = a[0] * RAD, p2 = b[1] * RAD, l2 = b[0] * RAD;
    var d = 2 * Math.asin(Math.sqrt(
      Math.pow(Math.sin((p2 - p1) / 2), 2) +
      Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin((l2 - l1) / 2), 2)));
    if (d < 1e-9) return [a[0], a[1]];
    var A = Math.sin((1 - t) * d) / Math.sin(d), B = Math.sin(t * d) / Math.sin(d);
    var x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
    var y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
    var z = A * Math.sin(p1) + B * Math.sin(p2);
    return [Math.atan2(y, x) * DEG, Math.atan2(z, Math.sqrt(x * x + y * y)) * DEG];
  }

  /* Distance orthodromique, en kilomètres. */
  function distance(a, b) {
    var p1 = a[1] * RAD, p2 = b[1] * RAD;
    var dp = (b[1] - a[1]) * RAD, dl = (b[0] - a[0]) * RAD;
    var h = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * RAYON_TERRE * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /* Cap initial pour aller de a vers b, en degrés depuis le nord. */
  function cap(a, b) {
    var p1 = a[1] * RAD, p2 = b[1] * RAD, dl = (b[0] - a[0]) * RAD;
    var y = Math.sin(dl) * Math.cos(p2);
    var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) * DEG + 360) % 360;
  }

  window.GLOBE = { creer: creer, distance: distance, cap: cap, interpoler: interpoler };
})();
