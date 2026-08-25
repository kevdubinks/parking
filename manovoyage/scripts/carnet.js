/* manovoyage — montage du carnet et conduite du dépliage.
 *
 * Deux axes, deux sens, et c'est toute l'interface :
 *   vertical   = lire le pli qu'on a sous les yeux
 *   horizontal = avancer dans le voyage
 * Quand un pli est lu jusqu'en bas, continuer vers le bas fait passer au
 * suivant. On n'a donc jamais besoin de savoir qu'il y a deux axes.
 */
(function () {
  'use strict';

  var CARNET = window.CARNET;
  var PLIAGE = window.PLIAGE;
  var TRAIT  = window.TRAIT;

  var HAUTEUR_TRAIT = 260;
  /* Le pli lu n'est pas au milieu exact : un peu à gauche, pour donner plus de
     place à ce qui reste à déplier. Un carnet se tient rarement bien centré. */
  var CADRAGE = 0.46;
  var SOBRE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene, bande, regle, compteur, elsPli = [], elsOmbre = [], elsContenu = [];
  var N = CARNET.volets.length;
  var L = 540, H = 760;

  var position = 0;      // pli affiché, en flottant
  var cible = 0;         // vers quoi on glisse
  var anime = false;
  var dernierLu = 0;
  var poussee = 0;   // report de molette, pour l'enchaînement entre plis
  var ouverture = SOBRE ? 1 : 0;   // 0 = carnet fermé, 1 = ouvert
  var debutOuverture = 0;

  /* ---------------------------------------------------------- dimensions */

  function mesurer() {
    H = Math.round(Math.min(880, Math.max(430, window.innerHeight - 92)));
    L = Math.round(Math.min(560, window.innerWidth * 0.9, Math.max(268, H * 0.70)));
    document.documentElement.style.setProperty('--pli-l', L + 'px');
    document.documentElement.style.setProperty('--pli-h', H + 'px');
  }

  /* ------------------------------------------------------------- fabrique */

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }

  /* Le contenu du carnet est écrit par l'auteur du site, pas saisi par un
     visiteur : on y autorise <em>, <s> et les corrections. */
  function ecrire(parent, classe, html) {
    var n = el('div', classe);
    n.innerHTML = html;
    parent.appendChild(n);
    return n;
  }


  /* Un tirage collé dans la page. Tant que le fichier n'est pas là, on montre
     l'emplacement — du papier photo non exposé — plutôt qu'une image cassée. */
  function montrerTirage(photo, large, differe) {
    /* Sans `cadrage`, le tirage garde les proportions d'un tirage (3:4), qui
       sont celles de toutes les photos du carnet : elles ne sont donc jamais
       recadrées. Un `cadrage` explicite recadre au centre. */
    var f = el('figure', 'tirage' + (photo.cadrage ? ' tirage--' + photo.cadrage : ''));
    f.classList.add(photo.pose === 'ruban' ? 'tirage--ruban' : 'tirage--coins');
    if (large) f.classList.add('tirage--large');
    f.style.setProperty('--angle', (photo.angle || 0) + 'deg');
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    f.setAttribute('aria-label', 'Tirage : ' + photo.legende);

    var cadre = el('div', 'cadre');
    /* La boîte porte les proportions du tirage et le papier ; l'image vient s'y
       loger. Séparer les deux permet de retirer purement et simplement l'image
       quand le fichier manque, sans que la page perde sa mise en forme. */
    var boite = el('div', 'vue-boite');
    cadre.appendChild(boite);

    if (photo.fichier) {
      var img = document.createElement('img');
      img.className = 'vue';
      img.alt = photo.legende;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        img.remove();
        poserAttente(f, boite, photo);
      });
      /* Dans le carnet, la source n'est posée qu'à l'approche du pli : soixante
         tirages chargés d'un coup, ce sont vingt méga-octets pour une page
         qu'on n'a pas encore dépliée. À plat, le navigateur s'en charge. */
      if (differe) img.dataset.source = photo.fichier;
      else img.src = photo.fichier;
      boite.appendChild(img);
    } else {
      poserAttente(f, boite, photo);
    }

    if (photo.pose !== 'ruban') {
      ['hg', 'hd', 'bg', 'bd'].forEach(function (c) {
        boite.appendChild(el('i', 'coin coin--' + c));
      });
    }
    f.appendChild(cadre);
    f.appendChild(el('figcaption', null, photo.legende));
    return f;
  }

  /* Emplacement en attente : plus d'image du tout, juste le papier et sa
     référence au crayon. Une <img> sans source garde l'icône d'image cassée du
     navigateur — le carnet aurait l'air en panne au lieu d'avoir l'air en
     attente. La légende reste sous le tirage. */
  function poserAttente(figure, boite, photo) {
    figure.classList.add('tirage--vide');
    if (photo.reference) boite.appendChild(el('span', 'attente', photo.reference));
  }

  /* Les tirages d'une étape se glissent après le paragraphe indiqué par
     `apres` ; sans indication, ils viennent à la fin du texte. */
  function collerTirages(corps, photos, differe) {
    photos.forEach(function (photo) {
      var t = montrerTirage(photo, false, differe);
      var cible = photo.apres != null ? corps.children[photo.apres] : null;
      if (cible) corps.insertBefore(t, cible);
      else corps.appendChild(t);
    });
  }

  function montrerRecto(volet, index, differe) {
    var c = el('div', 'contenu');

    if (volet.type === 'couverture') {
      c.classList.add('couverture');
      c.appendChild(el('div', 'numero', CARNET.numero));
      c.appendChild(el('h1', 'titre', CARNET.titre));
      c.appendChild(el('div', 'numero', CARNET.trajet));
      ecrire(c, 'exergue', volet.recto.exergue);
      var ul = el('ul', 'compte');
      volet.recto.lignes.forEach(function (t) { ul.appendChild(el('li', null, t)); });
      c.appendChild(ul);
      var t = el('div', 'tampon');
      CARNET.tampon.forEach(function (ligne, i) {
        if (i) t.appendChild(document.createElement('br'));
        t.appendChild(document.createTextNode(ligne));
      });
      c.appendChild(t);
      c.appendChild(el('div', 'pied', volet.recto.pied));
      return c;
    }

    if (volet.type === 'fin') {
      c.classList.add('final');
      ecrire(c, 'exergue', volet.recto.exergue);
      var ul2 = el('ul', 'compte');
      volet.recto.lignes.forEach(function (t) { ul2.appendChild(el('li', null, t)); });
      c.appendChild(ul2);
      c.appendChild(el('div', 'pied', volet.recto.pied));
      return c;
    }

    var e = el('div', 'entete');
    e.appendChild(el('span', 'lieu', volet.lieu));
    e.appendChild(el('span', 'pays', volet.pays));
    c.appendChild(e);

    var j = el('div', 'jalon');
    j.appendChild(el('span', null, volet.jour));
    j.appendChild(el('span', null, volet.date));
    j.appendChild(el('span', 'km', String(volet.km)));
    c.appendChild(j);

    ecrire(c, 'chapeau', volet.recto.chapeau);

    if (volet.recto.texte) {
      var corps = el('div', 'texte');
      volet.recto.texte.forEach(function (p) {
        var n = el('p'); n.innerHTML = p; corps.appendChild(n);
      });
      if (volet.recto.photos) collerTirages(corps, volet.recto.photos, differe);
      c.appendChild(corps);
    } else if (volet.recto.photos) {
      /* Pas encore de récit : la page est une planche de tirages. Rien n'y
         signale un manque — elle est finie ainsi, et le jour où un `texte`
         arrive, les tirages viennent se glisser dedans. */
      var photos = volet.recto.photos;
      var pl = el('div', 'planche' + (photos.length <= 2 ? ' planche--peu' : ''));
      photos.forEach(function (photo) {
        pl.appendChild(montrerTirage(photo, photos.length === 1, differe));
      });
      c.appendChild(pl);
    }

    if (volet.recto.piece) {
      var pc = el('div', 'piece piece--' + volet.recto.piece.type);
      pc.style.transform = 'rotate(' + volet.recto.piece.angle + 'deg)';
      pc.textContent = volet.recto.piece.lignes.join('\n');
      c.appendChild(pc);
    }

    (volet.recto.marges || []).forEach(function (m) {
      var n = el('div', 'marge marge--' + m.cote, m.texte);
      n.style.top = m.haut;
      c.appendChild(n);
    });

    return c;
  }

  function montrerVerso(volet) {
    var c = el('div', 'contenu');
    var v = volet.verso;
    c.appendChild(el('h3', null, v.entete));

    if (v.depenses) {
      var tab = el('table', 'depenses');
      var tb = document.createElement('tbody');
      v.depenses.forEach(function (d) {
        var tr = document.createElement('tr');
        var td = el('td', 'objet');
        td.appendChild(el('span', null, d[0]));
        tr.appendChild(td);
        tr.appendChild(el('td', 'montant', d[1]));
        tb.appendChild(tr);
      });
      if (v.total) {
        var tt = document.createElement('tr');
        tt.className = 'total';
        var tdo = el('td', 'objet');
        tdo.appendChild(el('span', null, 'total'));
        tt.appendChild(tdo);
        tt.appendChild(el('td', 'montant', v.total));
        tb.appendChild(tt);
      }
      tab.appendChild(tb);
      c.appendChild(tab);
    }

    (v.releves || (v.releve ? [v.releve] : [])).forEach(function (releve) {
      var r = el('div', 'releve');
      r.appendChild(el('div', 'titre-releve', releve.titre));
      r.appendChild(el('pre', null, releve.lignes.join('\n')));
      c.appendChild(r);
    });

    if (v.notes) {
      var ul = el('ul', 'notes');
      v.notes.forEach(function (t) { ul.appendChild(el('li', null, t)); });
      c.appendChild(ul);
    }
    return c;
  }

  /* Le trait : un seul dessin, une tranche par pli, même chemin partout.
     C'est ce qui rend le carnet continu à travers les pliures. */
  function poserTrait(face, index, dessin) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'trait');
    svg.setAttribute('width', L);
    svg.setAttribute('height', HAUTEUR_TRAIT);
    svg.setAttribute('viewBox', (index * L) + ' 0 ' + L + ' ' + HAUTEUR_TRAIT);
    svg.setAttribute('aria-hidden', 'true');
    [['trace-bis', dessin.traceBis], ['trace', dessin.trace]].forEach(function (p) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('class', p[0]);
      path.setAttribute('d', p[1]);
      svg.appendChild(path);
    });
    /* Une croix au droit de chaque étape : le trait touche la page ici. */
    dessin.reperes.forEach(function (r) {
      var croix = document.createElementNS(ns, 'path');
      croix.setAttribute('class', 'repere');
      croix.setAttribute('d', 'M ' + (r.x - 4) + ' ' + (r.y - 4) + ' l 8 8 M ' +
                              (r.x + 4) + ' ' + (r.y - 4) + ' l -8 8');
      svg.appendChild(croix);
    });
    face.appendChild(svg);
  }

  function batir() {
    /* Le trait est tracé depuis les latitudes relevées, pas inventé. */
    var latitudes = CARNET.volets.map(function (v) { return v.lat != null ? v.lat : null; });
    var dessin = TRAIT.construireTrait(latitudes, L, HAUTEUR_TRAIT);
    bande.textContent = '';
    elsPli = []; elsOmbre = []; elsContenu = [];

    CARNET.volets.forEach(function (volet, i) {
      var pli = el('div', 'pli');
      var feuille = el('div', 'feuille');

      var recto = el('article', 'face face--recto');
      poserTrait(recto, i, dessin);
      var cr = montrerRecto(volet, i, true);
      recto.appendChild(cr);
      var or = el('div', 'ombre'); recto.appendChild(or);

      var verso = el('article', 'face face--verso');
      var cv = montrerVerso(volet);
      verso.appendChild(cv);
      var ov = el('div', 'ombre'); verso.appendChild(ov);

      feuille.appendChild(recto);
      feuille.appendChild(verso);
      pli.appendChild(feuille);
      bande.appendChild(pli);

      elsPli.push(pli);
      elsOmbre.push([or, ov]);
      elsContenu.push([cr, cv]);
    });

    regle.textContent = '';
    for (var k = 0; k < N; k++) regle.appendChild(el('i'));
  }

  /* ------------------------------------------------------------- affichage */

  function nomDuPli(i) {
    var v = CARNET.volets[i];
    return v.lieu || v.titre || (v.type === 'couverture' ? 'couverture' : 'fin');
  }

  function rendre() {
    /* À l'ouverture, la portée part de très bas : le carnet est serré, puis
       il s'ouvre. C'est le premier geste du site, et il n'est pas décoratif —
       il montre d'emblée que la page est une bande pliée. */
    var portee = 0.5 + (PLIAGE.PORTEE - 0.5) * ouverture;
    var thetaMax = 80 - 8 * ouverture;

    var plis = PLIAGE.disposer(N, L, position, { portee: portee, thetaMax: thetaMax });
    var decalage = PLIAGE.recentrer(plis, position, window.innerWidth, CADRAGE);

    bande.style.transform =
      'translate3d(' + decalage.toFixed(2) + 'px,0,' + (-plis.profondeurLue).toFixed(2) + 'px)';

    var lu = Math.max(0, Math.min(N - 1, Math.round(position)));
    for (var i = 0; i < N; i++) {
      var p = plis[i];
      elsPli[i].style.transform =
        'translate3d(' + p.x.toFixed(2) + 'px,0,' + p.z.toFixed(2) + 'px) rotateY(' + p.angle.toFixed(2) + 'deg)';

      var noir = Math.pow(1 - p.aplat, 0.78);
      var miroir = p.versFond < 0;
      for (var f = 0; f < 2; f++) {
        var o = elsOmbre[i][f];
        o.style.opacity = noir.toFixed(3);
        o.classList.toggle('ombre--miroir', f === 0 ? miroir : !miroir);
      }
      elsPli[i].classList.toggle('pli--lu', i === lu);
    }

    /* Changer de pli, c'est tourner une page : on arrive par le haut quand on
       avance, par le bas quand on revient. Sans ça, on retombe au milieu d'une
       phrase laissée en plan au passage précédent. */
    if (lu !== dernierLu) {
      var versLaDroite = lu > dernierLu;
      elsContenu[lu].forEach(function (c) {
        c.scrollTop = versLaDroite ? 0 : c.scrollHeight;
      });
      dernierLu = lu;
      poussee = 0;
      reposerTirage();
      chargerAutour(lu);
    }

    for (var k = 0; k < regle.children.length; k++) {
      regle.children[k].classList.toggle('ici', k === lu);
    }
    compteur.textContent = 'pli ' + (lu + 1) + ' / ' + N + ' — ' + nomDuPli(lu);
    marquerSuite();
  }

  /* On pose les sources des tirages du pli lu et de ses voisins immédiats.
     Deux plis d'avance suffisent : le temps de déplier, l'image est là. */
  function chargerAutour(lu) {
    for (var i = Math.max(0, lu - 2); i <= Math.min(N - 1, lu + 2); i++) {
      var attente = elsPli[i].querySelectorAll('img.vue[data-source]');
      for (var k = 0; k < attente.length; k++) {
        attente[k].src = attente[k].dataset.source;
        delete attente[k].dataset.source;
      }
    }
  }

  /* Prévenir quand le texte du pli lu continue sous le bord. */
  function marquerSuite() {
    var lu = Math.max(0, Math.min(N - 1, Math.round(position)));
    var c = elsContenu[lu][bande.classList.contains('carnet--verso') ? 1 : 0];
    var reste = c.scrollHeight - c.clientHeight - c.scrollTop > 6;
    c.parentNode.classList.toggle('a-suivre', reste);
  }

  function boucle() {
    var actif = false;

    if (ouverture < 1) {
      var t = Math.min(1, (performance.now() - debutOuverture) / 1250);
      ouverture = 1 - Math.pow(1 - t, 3);
      actif = ouverture < 1;
    }

    var ecart = cible - position;
    if (Math.abs(ecart) > 0.0004) {
      position += SOBRE ? ecart : ecart * 0.17;
      actif = true;
    } else {
      position = cible;
    }

    rendre();
    if (actif) requestAnimationFrame(boucle);
    else anime = false;
  }

  function relancer() {
    if (!anime) { anime = true; requestAnimationFrame(boucle); }
  }

  function viser(v) {
    cible = Math.max(0, Math.min(N - 1, v));
    relancer();
  }

  function caler() { viser(Math.round(cible)); }

  /* --------------------------------------------------------------- gestes */

  var tempoCalage = null, dernierSaut = 0;

  function contenuLu() {
    var lu = Math.max(0, Math.min(N - 1, Math.round(position)));
    return elsContenu[lu][bande.classList.contains('carnet--verso') ? 1 : 0];
  }

  function surMolette(e) {
    var dx = e.deltaX, dy = e.deltaY;

    /* Geste franchement horizontal : on voyage. */
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      viser(cible + dx / (L * 0.75));
      clearTimeout(tempoCalage);
      tempoCalage = setTimeout(caler, 170);
      return;
    }

    /* Sinon on lit. Tant que le pli a du texte dans la direction demandée,
       la molette fait défiler le texte et rien d'autre. */
    var c = contenuLu();
    var bas = c.scrollHeight - c.clientHeight - c.scrollTop;
    if ((dy > 0 && bas > 1) || (dy < 0 && c.scrollTop > 1)) {
      c.scrollTop += dy;
      poussee = 0;
      e.preventDefault();
      marquerSuite();
      return;
    }

    /* Le pli est lu jusqu'au bout : on enchaîne sur le suivant. Le seuil
       évite de sauter une étape sur la lancée du défilement. */
    e.preventDefault();
    var maintenant = performance.now();
    if (maintenant - dernierSaut < 520) { poussee = 0; return; }
    poussee += dy;
    if (Math.abs(poussee) > 170) {
      viser(Math.round(cible) + (poussee > 0 ? 1 : -1));
      poussee = 0;
      dernierSaut = maintenant;
    }
  }

  var tire = null;

  function surAppui(e) {
    if (e.button != null && e.button !== 0) return;
    tire = { x: e.clientX, y: e.clientY, depart: cible, pris: false, id: e.pointerId };
  }

  function surGlisse(e) {
    if (!tire) return;
    var dx = e.clientX - tire.x, dy = e.clientY - tire.y;
    if (!tire.pris) {
      /* On ne capture que si le geste est franchement horizontal, sinon on
         empêcherait de sélectionner du texte ou de faire défiler un pli. */
      if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy)) return;
      tire.pris = true;
      scene.classList.add('tire');
      scene.setPointerCapture(tire.id);
    }
    viser(tire.depart - dx / (L * 0.82));
  }

  function surRelache() {
    if (!tire) return;
    if (tire.pris) { scene.classList.remove('tire'); caler(); }
    tire = null;
  }

  function surTouche(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { viser(Math.round(cible) + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { viser(Math.round(cible) - 1); e.preventDefault(); }
    else if (k === 'Home') { viser(0); e.preventDefault(); }
    else if (k === 'End') { viser(N - 1); e.preventDefault(); }
    else if (k === 'Escape') reposerTirage();
    else if ((k === 'Enter' || k === ' ') && document.activeElement &&
             document.activeElement.classList.contains('tirage')) {
      tenirTirage(document.activeElement); e.preventDefault();
    }
    else if (k === 'v' || k === 'V') retourner();
    else if (k === 'l' || k === 'L') basculerAplat();
  }

  function surClic(e) {
    if (tire && tire.pris) return;
    var pli = e.target.closest ? e.target.closest('.pli') : null;
    if (!pli) return;
    var i = elsPli.indexOf(pli);

    /* Sur un pli replié, le clic ouvre le pli : on n'attrape pas un tirage
       qu'on ne voit pas encore de face. */
    if (i >= 0 && i !== Math.round(cible)) { viser(i); return; }

    var t = e.target.closest('.tirage');
    if (t) tenirTirage(t);
  }

  /* Un seul tirage en main à la fois : on repose le précédent. */
  var enMain = null;
  function tenirTirage(t) {
    if (enMain && enMain !== t) enMain.classList.remove('tenu');
    enMain = t.classList.toggle('tenu') ? t : null;
  }
  function reposerTirage() {
    if (enMain) { enMain.classList.remove('tenu'); enMain = null; }
  }

  /* ------------------------------------------------------- faces et à-plat */

  function retourner() {
    reposerTirage();
    var verso = bande.classList.toggle('carnet--verso');
    document.getElementById('bouton-face').textContent = verso ? 'voir le récit' : 'voir le dos';
    marquerSuite();
  }

  function basculerAplat() {
    var plat = document.body.classList.toggle('mode-aplat');
    document.body.classList.toggle('est-plie', !plat);
    document.getElementById('bouton-aplat').textContent = plat ? 'replier' : 'lire à plat';
    if (!plat) { mesurer(); batir(); rendre(); }
  }

  /* ------------------------------------------------------------- à plat */

  function batirAplat() {
    var hote = document.querySelector('.bande-plate');
    CARNET.volets.forEach(function (volet, i) {
      if (i) hote.appendChild(el('hr', 'separation'));
      var s = el('section');
      s.appendChild(montrerRecto(volet, i, false));
      var dos = el('div', 'face--verso-plat');
      dos.appendChild(montrerVerso(volet));
      s.appendChild(dos);
      hote.appendChild(s);
    });
  }

  /* --------------------------------------------------------------- départ */

  function demarrer() {
    scene = document.querySelector('.scene');
    bande = document.querySelector('.bande');
    regle = document.querySelector('.regle');
    compteur = document.querySelector('.commandes .ou');

    mesurer();
    batir();
    batirAplat();
    chargerAutour(0);
    debutOuverture = performance.now();
    relancer();

    scene.addEventListener('wheel', surMolette, { passive: false });
    scene.addEventListener('pointerdown', surAppui);
    scene.addEventListener('pointermove', surGlisse);
    scene.addEventListener('pointerup', surRelache);
    scene.addEventListener('pointercancel', surRelache);
    scene.addEventListener('click', surClic);
    /* Atteindre un tirage au clavier doit déplier son pli, sinon le focus part
       sur quelque chose qui est hors de l'écran. */
    scene.addEventListener('focusin', function (e) {
      var pli = e.target.closest && e.target.closest('.pli');
      var i = pli ? elsPli.indexOf(pli) : -1;
      if (i >= 0 && i !== Math.round(cible)) viser(i);
    });
    window.addEventListener('keydown', surTouche);
    document.getElementById('bouton-face').addEventListener('click', retourner);
    document.getElementById('bouton-aplat').addEventListener('click', basculerAplat);

    var minuteur = null;
    window.addEventListener('resize', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(function () {
        if (document.body.classList.contains('mode-aplat')) return;
        mesurer(); batir(); rendre();
      }, 140);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
