/* manovoyage — la conduite du vol.
 *
 * Quatre altitudes, une seule touche pour remonter :
 *   seuil    l'arrivée, le globe tourne tout seul
 *   globe    croisière puis approche — on fait tourner la Terre, on descend
 *   ville    le panneau monte : l'histoire de la ville et toutes ses photos
 *   postale  une photo en grand, qu'on retourne pour lire le mot
 *
 * Rien n'est jamais empilé : Échap remonte d'un cran, toujours, et c'est la
 * seule chose à savoir.
 */
(function () {
  'use strict';

  var L = window.LIEUX, GLOBE = window.GLOBE;
  var RAD = Math.PI / 180;

  var COULEURS = {
    merClaire: '#183away', merSombre: '#050d15',
    terre: '#242a1d', cote: '#71835a',
    grille: 'rgba(150,190,205,.085)',
    halo: 'rgba(86,150,196,.20)',
    limbe: 'rgba(0,0,0,.6)',
    horizon: 'rgba(150,196,215,.26)'
  };
  COULEURS.merClaire = '#17364a';

  var canvas, ciel, globe, elReperes, elPanneau, elPostale, elInstruments, elSeuil, elBarre;
  var vue = 'seuil';
  var villeCourante = null, photosVille = [], iPhoto = 0;
  var vol = null, derive = 0.028;           // rotation lente à l'arrivée
  var reperes = [];                          // marqueurs DOM
  var centreVoyage;

  /* Échelles : combien de degrés l'écran doit embrasser à chaque altitude.
     On les exprime ainsi et non en pixels, pour que la vue soit la même sur un
     téléphone et sur un grand écran. */
  var ETENDUES = { croisiere: 190, approche: 17, ville: 3.4 };
  function rayonPour(etendue) {
    return Math.min(globe.largeur, globe.hauteur) / (etendue * RAD);
  }

  /* ------------------------------------------------------------- fabrique */

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }
  function vignette(photo) { return 'medias/vignettes/' + photo.ref + '.jpg'; }

  function toutesLesPhotos(ville) {
    var out = [];
    ville.sites.forEach(function (s) {
      s.photos.forEach(function (p) { out.push({ photo: p, site: s, ville: ville }); });
    });
    return out;
  }

  function coordonnees(lat, lng) {
    return Math.abs(lat).toFixed(2) + '° ' + (lat >= 0 ? 'N' : 'S') + '   ' +
           Math.abs(lng).toFixed(2) + '° ' + (lng >= 0 ? 'E' : 'O');
  }

  /* --------------------------------------------------------------- le vol */

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* Aller quelque part. On interpole la longitude par le plus court chemin, et
     le rayon en logarithmique — sinon la fin du zoom paraît s'emballer.
     La bosse sur le rayon est le geste de l'avion : on prend d'abord un peu de
     hauteur, puis on descend. Sans elle, le déplacement est un fondu ; avec,
     c'est un vol. */
  function volerVers(lon, lat, R, duree, apres) {
    var d0 = { lambda: globe.lambda, phi: globe.phi, logR: Math.log(globe.R) };
    var dLambda = ((lon - d0.lambda + 540) % 360) - 180;
    var logR1 = Math.log(R);
    var ecart = Math.abs(dLambda) + Math.abs(lat - d0.phi);
    var bosse = Math.min(0.75, ecart / 22) * (logR1 > d0.logR ? 1 : 0.35);
    var debut = performance.now();
    vol = function (maintenant) {
      var t = Math.min(1, (maintenant - debut) / duree), e = ease(t);
      globe.lambda = d0.lambda + dLambda * e;
      globe.phi = d0.phi + (lat - d0.phi) * e;
      globe.R = Math.exp(d0.logR + (logR1 - d0.logR) * e - bosse * Math.sin(Math.PI * e));
      if (t >= 1) { vol = null; if (apres) apres(); }
    };
  }

  /* ---------------------------------------------------------- les repères */

  function construireReperes() {
    elReperes.textContent = '';
    reperes = [];

    /* Un seul repère à l'altitude de croisière : quatre villes séparées de
       quelques degrés se chevaucheraient en un point. */
    reperes.push(faireRepere({
      pays: true, nom: L.pays, lat: centreVoyage[1], lng: centreVoyage[0],
      compte: L.villes.reduce(function (a, v) { return a + toutesLesPhotos(v).length; }, 0) + ' photos',
      image: vignette(L.villes[0].sites[0].photos[0]),
      action: function () { approcher(); }
    }));

    L.villes.forEach(function (ville) {
      reperes.push(faireRepere({
        pays: false, nom: ville.nom, lat: ville.lat, lng: ville.lng,
        compte: toutesLesPhotos(ville).length + ' photos',
        image: vignette(ville.sites[0].photos[0]),
        action: function () { ouvrirVille(ville); }
      }));
    });
  }

  function faireRepere(d) {
    var b = el('button', 'repere');
    b.type = 'button';
    b.setAttribute('aria-label', d.nom + ', ' + d.compte);
    /* La bulle flotte au-dessus du point, mais elle peut se déplacer pour ne
       pas en recouvrir une autre : le point, lui, reste sur les coordonnées. */
    var bulle = el('span', 'bulle');
    var img = el('img', 'vignette');
    img.src = d.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    bulle.appendChild(img);
    bulle.appendChild(el('span', 'etiquette', d.nom));
    bulle.appendChild(el('span', 'compte', d.compte));
    b.appendChild(bulle);
    b.appendChild(el('i', 'point'));
    b.bulle = bulle;
    b.addEventListener('click', function (e) { e.stopPropagation(); d.action(); });
    b.donnees = d;
    elReperes.appendChild(b);
    return b;
  }

  /* Positions d'essai pour une bulle, dans l'ordre où on les tente : au-dessus,
     puis en dessous, puis décalée. Deux villes à soixante-dix kilomètres l'une
     de l'autre se superposeraient sinon, et leurs deux noms deviendraient
     illisibles d'un coup. */
  var ESSAIS = [[0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

  function majReperes() {
    var villes = globe.R > rayonPour(ETENDUES.approche) * 0.42;
    var poses = [], i, r, d;

    for (i = 0; i < reperes.length; i++) {
      r = reperes[i]; d = r.donnees;
      var visible = (d.pays !== villes);
      var p = globe.projeter(d.lng, d.lat);
      var dedans = p.devant && p.x > -80 && p.x < globe.largeur + 80 &&
                              p.y > -80 && p.y < globe.hauteur + 80;
      r.classList.toggle('derriere', !visible || !dedans);
      if (!visible || !dedans) { r.aPlacer = null; continue; }
      r.style.transform = 'translate(-50%,-50%) translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      r.aPlacer = p;
    }

    /* Du nord au sud : l'ordre n'a pas d'importance en soi, il rend seulement
       le placement stable d'une image à l'autre. */
    var actifs = reperes.filter(function (x) { return x.aPlacer; })
                        .sort(function (a, b) { return a.aPlacer.y - b.aPlacer.y; });

    for (i = 0; i < actifs.length; i++) {
      r = actifs[i];
      var l = r.bulle.offsetWidth || 108, h = r.bulle.offsetHeight || 104;
      var p2 = r.aPlacer, place = null;
      for (var e = 0; e < ESSAIS.length; e++) {
        var dx = ESSAIS[e][0] * (l * 0.62), dy = ESSAIS[e][1];
        var boite = {
          x: p2.x + dx - l / 2,
          y: dy < 0 ? p2.y - 16 - h : p2.y + 16,
          l: l, h: h
        };
        if (!chevauche(boite, poses)) { place = { dx: dx, dy: dy, boite: boite }; break; }
      }
      if (!place) {
        place = { dx: 0, dy: -1, boite: { x: p2.x - l / 2, y: p2.y - 16 - h, l: l, h: h } };
      }
      poses.push(place.boite);
      r.bulle.style.transform =
        'translate(-50%,' + (place.dy < 0 ? '-100%' : '0') + ') translate(' +
        place.dx.toFixed(0) + 'px,' + (place.dy < 0 ? -16 : 16) + 'px)';
      r.bulle.classList.toggle('dessous', place.dy > 0);
    }
  }

  function chevauche(b, liste) {
    for (var i = 0; i < liste.length; i++) {
      var o = liste[i];
      if (b.x < o.x + o.l && b.x + b.l > o.x && b.y < o.y + o.h && b.y + b.h > o.y) return true;
    }
    return false;
  }

  /* ------------------------------------------------------- les instruments */

  var dernierHUD = '';
  function majInstruments() {
    var alt = globe.altitude();
    var texte;
    if (alt > 900) texte = Math.round(alt / 10) * 10 + ' km';
    else if (alt > 10) texte = alt.toFixed(0) + ' km';
    else texte = Math.round(alt * 1000) + ' m';

    /* Vers quoi on regarde : la ville la plus proche du centre de l'écran. */
    var proche = null, dMin = Infinity;
    L.villes.forEach(function (v) {
      var d = GLOBE.distance([globe.lambda, globe.phi], [v.lng, v.lat]);
      if (d < dMin) { dMin = d; proche = v; }
    });
    var cap = GLOBE.cap([globe.lambda, globe.phi], [proche.lng, proche.lat]);

    var html =
      '<dl>' +
      '<dt>alt</dt><dd><b>' + texte + '</b></dd>' +
      '<dt>lat</dt><dd>' + Math.abs(globe.phi).toFixed(2) + '° ' + (globe.phi >= 0 ? 'N' : 'S') + '</dd>' +
      '<dt>lon</dt><dd>' + Math.abs(globe.lambda).toFixed(2) + '° ' + (globe.lambda >= 0 ? 'E' : 'O') + '</dd>' +
      '</dl><div class="cap-suivant">' +
      (dMin < 6 ? '▾ ' + proche.nom.toUpperCase()
                : '→ ' + proche.nom.toUpperCase() + '  ' + Math.round(dMin) + ' km  cap ' +
                  ('00' + Math.round(cap)).slice(-3)) +
      '</div>';
    if (html !== dernierHUD) { elInstruments.innerHTML = html; dernierHUD = html; }
  }

  /* --------------------------------------------------------- boucle */

  function boucler(maintenant) {
    if (vol) vol(maintenant);
    else if (vue === 'seuil') globe.lambda += derive;

    globe.dessiner(COULEURS);
    globe.tracerRoute(L.villes.map(function (v) { return [v.lng, v.lat]; }),
                      'rgba(224,169,79,.5)', globe.R > rayonPour(60) ? 1.4 : 1);
    majReperes();
    majInstruments();
    requestAnimationFrame(boucler);
  }

  /* ------------------------------------------------------------- les vues */

  function decoller() {
    if (vue !== 'seuil') return;
    vue = 'globe';
    elSeuil.classList.add('parti');
    elBarre.hidden = false;
    volerVers(centreVoyage[0], centreVoyage[1], rayonPour(ETENDUES.approche), 2600);
  }

  function approcher() {
    vue = 'globe';
    fermerPanneau();
    volerVers(centreVoyage[0], centreVoyage[1], rayonPour(ETENDUES.approche), 1500);
  }

  function croisiere() {
    vue = 'globe';
    fermerPanneau();
    volerVers(centreVoyage[0], centreVoyage[1], rayonPour(ETENDUES.croisiere), 1600);
  }

  function ouvrirVille(ville) {
    villeCourante = ville;
    photosVille = toutesLesPhotos(ville);
    volerVers(ville.lng, ville.lat, rayonPour(ETENDUES.ville), 1700, function () {
      vue = 'ville';
      remplirVille(ville);
      elPanneau.classList.add('ouvert');
      elPanneau.scrollTop = 0;
      elPanneau.focus({ preventScroll: true });
    });
  }

  function fermerPanneau() {
    elPanneau.classList.remove('ouvert');
    if (vue === 'ville') vue = 'globe';
  }

  function remplirVille(ville) {
    var d = el('div', 'dedans');

    var haut = el('div', 'haut');
    haut.appendChild(el('h2', null, ville.nom));
    haut.appendChild(el('span', 'sous', ville.sous));
    haut.appendChild(el('span', 'coord mono', coordonnees(ville.lat, ville.lng)));
    d.appendChild(haut);

    var corps = el('div', 'ville-corps');
    var hist = el('div', 'histoire');
    ville.histoire.forEach(function (p) { hist.appendChild(el('p', null, p)); });
    corps.appendChild(hist);

    /* La fiche : ce qui est mesuré, en face de ce qui est raconté. Elle occupe
       la colonne que le texte laissait vide. */
    var fiche = el('aside', 'fiche mono');
    var lignes = [
      ['lieux', ville.sites.length],
      ['photos', photosVille.length],
      ['km', ville.sites[0].km + ' → ' + ville.sites[ville.sites.length - 1].km]
    ];
    var dl = el('dl');
    lignes.forEach(function (l) {
      dl.appendChild(el('dt', null, l[0]));
      dl.appendChild(el('dd', null, String(l[1])));
    });
    fiche.appendChild(dl);
    var liste = el('ol', 'liste-sites');
    ville.sites.forEach(function (site) {
      var li = el('li');
      var a = el('button', 'aller');
      a.type = 'button';
      a.textContent = site.nom;
      a.addEventListener('click', function () {
        var t = elPanneau.querySelector('[data-site="' + site.nom + '"]');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      li.appendChild(el('span', 'compte-site', site.photos.length));
      liste.appendChild(li);
    });
    fiche.appendChild(liste);
    corps.appendChild(fiche);
    d.appendChild(corps);

    ville.sites.forEach(function (site) {
      var s = el('section', 'site');
      s.setAttribute('data-site', site.nom);
      var t = el('div', 'titre-site');
      t.appendChild(el('h3', null, site.nom));
      t.appendChild(el('span', 'note', site.texte));
      t.appendChild(el('span', 'km', site.km + ' km'));
      s.appendChild(t);

      var g = el('div', 'grille');
      site.photos.forEach(function (photo) {
        var b = el('button', 'cliche');
        b.type = 'button';
        var img = el('img');
        img.src = vignette(photo); img.alt = photo.legende;
        img.loading = 'lazy'; img.decoding = 'async';
        b.appendChild(img);
        b.appendChild(el('figcaption', null, photo.legende));
        b.addEventListener('click', function () {
          ouvrirPostale(photosVille.findIndex(function (x) { return x.photo === photo; }));
        });
        g.appendChild(b);
      });
      s.appendChild(g);
      d.appendChild(s);
    });

    elPanneau.textContent = '';
    elPanneau.appendChild(d);
  }

  function ouvrirDecouverte() {
    var d = el('div', 'dedans');
    var haut = el('div', 'haut');
    haut.appendChild(el('h2', null, 'Découverte'));
    haut.appendChild(el('span', 'sous', L.villes.length + ' villes, ' +
      L.villes.reduce(function (a, v) { return a + toutesLesPhotos(v).length; }, 0) + ' photos'));
    haut.appendChild(el('span', 'coord mono', L.distance + ' km'));
    d.appendChild(haut);

    var index = el('div', 'index');
    L.villes.forEach(function (ville) {
      var b = el('button', 'carte-ville');
      b.type = 'button';
      var img = el('img');
      img.src = vignette(ville.sites[0].photos[0]); img.alt = ''; img.loading = 'lazy';
      b.appendChild(img);
      var v = el('div', 'voile');
      v.appendChild(el('span', 'nom', ville.nom));
      v.appendChild(el('span', 'chiffres', ville.sites.length + ' lieux · ' +
                                           toutesLesPhotos(ville).length + ' photos'));
      b.appendChild(v);
      b.addEventListener('click', function () { ouvrirVille(ville); });
      index.appendChild(b);
    });
    d.appendChild(index);

    elPanneau.textContent = '';
    elPanneau.appendChild(d);
    elPanneau.classList.add('ouvert');
    elPanneau.scrollTop = 0;
    vue = 'ville';
  }

  /* ---------------------------------------------------- la carte postale */

  function ouvrirPostale(i) {
    if (i < 0) return;
    iPhoto = i;
    remplirPostale();
    elPostale.classList.add('ouverte');
    elPostale.classList.remove('retournee');
    vue = 'postale';
  }

  function fermerPostale() {
    elPostale.classList.remove('ouverte');
    vue = villeCourante ? 'ville' : 'globe';
  }

  function tournerPostale(pas) {
    iPhoto = (iPhoto + pas + photosVille.length) % photosVille.length;
    elPostale.classList.remove('retournee');
    remplirPostale();
  }

  function remplirPostale() {
    var e = photosVille[iPhoto];
    var ville = e.ville;
    var carte = elPostale.querySelector('.carte');
    carte.textContent = '';

    var recto = el('figure', 'face face--recto');
    var img = el('img');
    img.src = e.photo.fichier; img.alt = e.photo.legende; img.decoding = 'async';
    recto.appendChild(img);
    recto.appendChild(el('figcaption', null, e.photo.legende));
    carte.appendChild(recto);

    var dos = el('div', 'face face--dos');
    var g = el('div', 'dos-grille');
    g.appendChild(el('div', 'dos-mot', ville.mot));

    var dr = el('div', 'dos-droite');
    var t = el('div', 'timbre');
    var ti = el('img');
    /* Le timbre porte une autre vue de la même ville : la carte parle d'un
       endroit, pas d'une seule photo. */
    var autre = photosVille[(iPhoto + 3) % photosVille.length];
    ti.src = vignette(autre.photo); ti.alt = '';
    t.appendChild(ti);
    dr.appendChild(t);

    var c = el('div', 'cachet');
    var court = Math.abs(ville.lat).toFixed(1) + (ville.lat >= 0 ? 'N' : 'S') + ' ' +
                Math.abs(ville.lng).toFixed(1) + (ville.lng >= 0 ? 'E' : 'O');
    c.appendChild(el('span', null, ville.nom));
    c.appendChild(el('span', null, L.pays));
    c.appendChild(el('span', 'coord-cachet', court));
    dr.appendChild(c);

    var ad = el('div', 'dos-adresse');
    ad.appendChild(el('i')); ad.appendChild(el('i')); ad.appendChild(el('i'));
    dr.appendChild(ad);
    dr.appendChild(el('div', 'dos-legende', e.site.nom + '  ·  ' + e.photo.ref));
    g.appendChild(dr);
    dos.appendChild(g);
    carte.appendChild(dos);

    elPostale.querySelector('.compteur').textContent = (iPhoto + 1) + ' / ' + photosVille.length;
  }

  /* ------------------------------------------------------------- gestes */

  var tire = null, elan = { x: 0, y: 0 }, pincee = null;

  function surAppui(e) {
    if (vue !== 'globe' || vol) return;
    tire = { x: e.clientX, y: e.clientY, bouge: false };
    elan.x = elan.y = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('tire');
  }
  function surGlisse(e) {
    if (!tire) return;
    var dx = e.clientX - tire.x, dy = e.clientY - tire.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) tire.bouge = true;
    globe.tourner(dx, dy);
    elan.x = dx; elan.y = dy;
    tire.x = e.clientX; tire.y = e.clientY;
  }
  function surRelache() {
    if (!tire) return;
    tire = null;
    canvas.classList.remove('tire');
  }

  function zoomer(facteur, duree) {
    var min = rayonPour(ETENDUES.croisiere) * 0.8;
    var max = rayonPour(ETENDUES.ville) * 2.4;
    var R = Math.max(min, Math.min(max, globe.R * facteur));
    if (duree) volerVers(globe.lambda, globe.phi, R, duree);
    else globe.R = R;
  }

  function surMolette(e) {
    if (vue !== 'globe') return;
    e.preventDefault();
    if (vol) return;
    zoomer(Math.exp(-e.deltaY * 0.0016), 0);
  }

  function surTouche(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      if (vue === 'postale') fermerPostale();
      else if (vue === 'ville') { fermerPanneau(); approcher(); }
      else if (vue === 'globe') croisiere();
      return;
    }
    if (vue === 'postale') {
      if (k === 'ArrowRight') { tournerPostale(1); e.preventDefault(); }
      else if (k === 'ArrowLeft') { tournerPostale(-1); e.preventDefault(); }
      else if (k === ' ' || k === 'Enter') { elPostale.classList.toggle('retournee'); e.preventDefault(); }
      return;
    }
    if (vue === 'seuil' && (k === 'Enter' || k === ' ')) { decoller(); e.preventDefault(); }
    if (vue === 'globe' && !vol) {
      if (k === '+' || k === '=') zoomer(1.35, 320);
      else if (k === '-') zoomer(1 / 1.35, 320);
    }
  }

  /* --------------------------------------------------------------- étoiles */

  function semerEtoiles() {
    var c = ciel.getContext('2d');
    var d = Math.min(window.devicePixelRatio || 1, 2);
    ciel.width = Math.round(ciel.clientWidth * d);
    ciel.height = Math.round(ciel.clientHeight * d);
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, ciel.clientWidth, ciel.clientHeight);
    /* Graine fixe : le ciel est le même à chaque chargement, comme un vrai. */
    var a = 20240902;
    function rnd() { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; }
    var n = Math.round(ciel.clientWidth * ciel.clientHeight / 5200);
    for (var i = 0; i < n; i++) {
      var x = rnd() * ciel.clientWidth, y = rnd() * ciel.clientHeight;
      var r = rnd(), taille = r * r * 1.5 + 0.28;
      c.globalAlpha = 0.16 + r * 0.55;
      c.fillStyle = r > 0.93 ? '#cfe0ff' : '#fff';
      c.beginPath(); c.arc(x, y, taille, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  }

  /* --------------------------------------------------------------- départ */

  function demarrer() {
    canvas = document.querySelector('.globe');
    ciel = document.querySelector('.etoiles');
    elReperes = document.querySelector('.reperes');
    elPanneau = document.querySelector('.panneau');
    elPostale = document.querySelector('.postale');
    elInstruments = document.querySelector('.instruments');
    elSeuil = document.querySelector('.seuil');
    elBarre = document.querySelector('.barre');

    var lons = L.villes.map(function (v) { return v.lng; });
    var lats = L.villes.map(function (v) { return v.lat; });
    centreVoyage = [
      (Math.min.apply(null, lons) + Math.max.apply(null, lons)) / 2,
      (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2
    ];

    globe = GLOBE.creer(canvas);
    globe.dimensionner();
    semerEtoiles();
    globe.lambda = centreVoyage[0] - 46;
    globe.phi = 16;
    globe.R = rayonPour(ETENDUES.croisiere);
    construireReperes();

    canvas.addEventListener('pointerdown', surAppui);
    canvas.addEventListener('pointermove', surGlisse);
    canvas.addEventListener('pointerup', surRelache);
    canvas.addEventListener('pointercancel', surRelache);
    canvas.addEventListener('wheel', surMolette, { passive: false });
    window.addEventListener('keydown', surTouche);

    document.querySelector('.seuil .bouton').addEventListener('click', decoller);
    document.querySelector('[data-action="decouverte"]').addEventListener('click', ouvrirDecouverte);
    document.querySelector('[data-action="remonter"]').addEventListener('click', function () {
      if (vue === 'ville') { fermerPanneau(); approcher(); } else croisiere();
    });
    elPostale.querySelector('[data-action="fermer"]').addEventListener('click', fermerPostale);
    elPostale.querySelector('[data-action="retourner"]').addEventListener('click', function () {
      elPostale.classList.toggle('retournee');
    });
    elPostale.querySelector('[data-action="precedent"]').addEventListener('click', function () { tournerPostale(-1); });
    elPostale.querySelector('[data-action="suivant"]').addEventListener('click', function () { tournerPostale(1); });
    elPostale.querySelector('.carte').addEventListener('click', function () {
      elPostale.classList.toggle('retournee');
    });
    elPostale.addEventListener('click', function (e) { if (e.target === elPostale) fermerPostale(); });

    var minuteur = null;
    window.addEventListener('resize', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { globe.dimensionner(); semerEtoiles(); }, 120);
    });

    requestAnimationFrame(boucler);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
