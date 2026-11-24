import { icon } from '../modules.js';
import { scriptGoogle } from '../stage-script.js';

// Les données de stage ne passent jamais par GitHub : elles sont lues en direct
// dans le Google Sheet via le script de Hugues, avec une clé gardée sur l'appareil.
const KEY = 'mon-espace:stage';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lireConf = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const ecrireConf = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };
const vue = { onglet: 'Suivi candidatures', edition: null, ajout: false };

async function appel(conf, corps) {
  const r = await fetch(conf.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ cle: conf.cle, ...corps }) });
  const d = await r.json();
  if (d.erreur) throw new Error(d.erreur);
  return d;
}

export async function render(el) {
  const conf = lireConf();
  if (!conf.url) return installation(el, conf);

  // Affiche tout de suite la dernière copie, puis rafraîchit
  if (conf.cache) dessiner(el, conf, conf.cache, true);
  else el.innerHTML = '<p class="empty">Chargement de ton tableau…</p>';
  try {
    const cache = await appel(conf, { action: 'lire' });
    ecrireConf({ ...lireConf(), cache });
    dessiner(el, { ...conf, cache }, cache, false);
  } catch (err) {
    if (!conf.cache) el.innerHTML = `<section class="card"><p class="warn">Impossible de joindre ton tableau : ${esc(err.message)}</p>
      <button class="btn small ghost" data-reinit>Refaire l'installation</button></section>`;
    else el.querySelector('[data-etat]')?.replaceChildren(document.createTextNode('Hors ligne : dernière version enregistrée'));
    el.querySelector('[data-reinit]')?.addEventListener('click', () => { ecrireConf({}); render(el); });
  }
}

// ===== Relances : calculées à partir des colonnes du tableau =====
function parseDate(txt) {
  const m = String(txt).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
  if (!m) return null;
  const [j, mo, a] = m[m.length - 1].split('/').map(Number); // la date la plus récente (ex. relance)
  return new Date(a, mo - 1, j);
}
function relances(onglet) {
  if (!onglet) return [];
  const h = onglet.entetes.map((x) => x.toLowerCase());
  const col = (mot) => h.findIndex((x) => x.includes(mot));
  const [cEnv, cRes, cRel, cAct] = [col('envoy'), col('résultat'), col('relancer'), col('prochaine')];
  const aujourdhui = new Date();
  return onglet.lignes.map((l) => {
    const v = l.valeurs;
    const relancer = String(v[cRel] || '').toLowerCase();
    const resultat = String(v[cRes] || '').toLowerCase();
    const envoi = parseDate(v[cEnv]);
    const jours = envoi ? Math.floor((aujourdhui - envoi) / 86400000) : null;
    let raison = '';
    if (relancer.startsWith('oui')) raison = 'Marqué « à relancer »';
    else if ((resultat.includes('pas de réponse') || resultat.includes('⏳') || !resultat.trim()) && jours !== null && jours >= 10 && !relancer.startsWith('non'))
      raison = `Sans réponse depuis ${jours} jours`;
    return raison ? { l, raison, action: v[cAct] } : null;
  }).filter(Boolean);
}

function dessiner(el, conf, d, depuisCache) {
  const onglets = d.onglets || [];
  const suivi = onglets.find((o) => o.nom === 'Suivi candidatures');
  const courant = onglets.find((o) => o.nom === vue.onglet) || onglets[0];
  const aRelancer = relances(suivi);
  const resIdx = suivi ? suivi.entetes.findIndex((x) => x.toLowerCase().includes('résultat')) : -1;
  const compte = (mot) => suivi ? suivi.lignes.filter((l) => String(l.valeurs[resIdx] || '').toLowerCase().includes(mot)).length : 0;
  const majTxt = d.maj ? new Date(d.maj).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  el.innerHTML = `
  <header class="page-head">
    <div><p class="eyebrow">Stage</p><h1>Ma recherche de stage</h1></div>
    <div class="month-nav">
      <small class="muted" data-etat>${depuisCache ? 'Mise à jour…' : `À jour · ${esc(majTxt)}`}</small>
      <button class="icon-btn" data-rafraichir aria-label="Actualiser">${icon('refresh', 18)}</button>
      <a class="btn small ghost" href="${esc(conf.lienSheet || 'https://docs.google.com/spreadsheets/')}" target="_blank" rel="noopener">Ouvrir le Sheet</a>
    </div>
  </header>

  <section class="lang-stats">
    <div><span class="big">📨 ${suivi ? suivi.lignes.length : 0}</span><small>candidatures</small></div>
    <div><span class="big">✅ ${compte('positif')}</span><small>positives</small></div>
    <div><span class="big">🔔 ${aRelancer.length}</span><small>à relancer</small></div>
  </section>

  <div class="stage-grid">
    <section class="card">
      <div class="card-head"><h2>${icon('bell')} À relancer</h2></div>
      ${aRelancer.length ? `<ul class="relances">${aRelancer.map((r) => `
        <li><strong>${esc(r.l.valeurs[0])}</strong><span>${esc(r.l.valeurs[1] || '')}</span>
          <em>${esc(r.raison)}</em>${r.action ? `<p>${esc(r.action)}</p>` : ''}</li>`).join('')}</ul>`
        : '<p class="empty">Rien à relancer pour l\'instant 👌</p>'}
    </section>

  </div>

  <nav class="filters">${onglets.map((o) => `<button class="filter${o === courant ? ' on' : ''}" style="--rub:var(--majorelle)" data-onglet="${esc(o.nom)}">${esc(o.nom)} · ${o.lignes.length}</button>`).join('')}
    <button class="filter" style="--rub:var(--majorelle)" data-ajouter>${icon('plus', 14)} Ajouter</button></nav>

  ${vue.ajout && courant ? formulaire(courant, null) : ''}
  <section class="rows">
    ${courant ? courant.lignes.map((l) => vue.edition === l.ligne ? formulaire(courant, l) : carte(courant, l)).join('') || '<p class="empty">Ce tableau est vide.</p>' : ''}
  </section>`;

  const on = (s, ev, fn) => el.querySelectorAll(s).forEach((b) => b.addEventListener(ev, (e) => fn(b, e)));
  on('[data-rafraichir]', 'click', () => render(el));
  on('[data-onglet]', 'click', (b) => { vue.onglet = b.dataset.onglet; vue.edition = null; vue.ajout = false; dessiner(el, conf, d, depuisCache); });
  on('[data-ajouter]', 'click', () => { vue.ajout = !vue.ajout; vue.edition = null; dessiner(el, conf, d, depuisCache); });
  on('[data-editer]', 'click', (b) => { vue.edition = +b.dataset.editer; vue.ajout = false; dessiner(el, conf, d, depuisCache); });
  on('[data-annuler]', 'click', () => { vue.edition = null; vue.ajout = false; dessiner(el, conf, d, depuisCache); });
  on('[data-form-ligne]', 'submit', async (f, e) => {
    e.preventDefault();
    const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enregistrement…';
    const valeurs = courant.entetes.map((_, i) => f.elements[`c${i}`]?.value ?? '');
    try {
      if (f.dataset.formLigne === 'nouvelle') {
        await appel(conf, { action: 'ajouter', onglet: courant.nom, valeurs });
      } else {
        const ligne = courant.lignes.find((l) => l.ligne === +f.dataset.formLigne);
        for (let i = 0; i < valeurs.length; i++) {
          if (valeurs[i] !== (ligne.valeurs[i] ?? '')) await appel(conf, { action: 'modifier', onglet: courant.nom, ligne: ligne.ligne, colonne: i + 1, valeur: valeurs[i] });
        }
      }
      vue.edition = null; vue.ajout = false;
      render(el);
    } catch (err) { btn.disabled = false; btn.textContent = 'Réessayer'; f.insertAdjacentHTML('beforeend', `<p class="warn">${esc(err.message)}</p>`); }
  });
}

function carte(o, l) {
  const [titre, ...reste] = l.valeurs;
  return `<article class="row-card">
    <div class="row-head"><h3>${esc(titre || '(sans nom)')}</h3>
      <button class="icon-btn" data-editer="${l.ligne}" aria-label="Modifier">${icon('edit', 16)}</button></div>
    <dl>${reste.map((v, i) => v ? `<div><dt>${esc(o.entetes[i + 1])}</dt><dd>${/^https?:\/\//.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener">Voir le lien</a>` : esc(v)}</dd></div>` : '').join('')}</dl>
  </article>`;
}

function formulaire(o, l) {
  const options = (i) => [...new Set(o.lignes.map((x) => x.valeurs[i]).filter(Boolean))];
  return `<form class="row-card editing" data-form-ligne="${l ? l.ligne : 'nouvelle'}">
    <h3>${l ? 'Modifier' : 'Nouvelle ligne'} · ${esc(o.nom)}</h3>
    ${o.entetes.map((h, i) => {
      const v = l ? l.valeurs[i] ?? '' : '';
      const opts = options(i);
      const court = opts.length > 1 && opts.length <= 8 && opts.every((x) => x.length < 30);
      return `<label class="field-col"><span>${esc(h || `Colonne ${i + 1}`)}</span>
        ${court ? `<input name="c${i}" value="${esc(v)}" list="dl-${i}"><datalist id="dl-${i}">${opts.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`
          : v.length > 60 || /répondu|action|pourquoi|avis/i.test(h) ? `<textarea name="c${i}" rows="3">${esc(v)}</textarea>`
          : `<input name="c${i}" value="${esc(v)}">`}</label>`;
    }).join('')}
    <div class="form-actions"><button type="button" class="btn small ghost" data-annuler>Annuler</button><button type="submit" class="btn small">Enregistrer</button></div>
  </form>`;
}

// ===== Installation guidée (une seule fois par appareil) =====
function installation(el, conf) {
  const cle = conf.cle || Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join('');
  ecrireConf({ ...conf, cle });
  el.innerHTML = `
  <header class="page-head"><div><p class="eyebrow">Stage</p><h1>Relier ton tableau de stage</h1></div></header>
  <section class="card setup">
    <p>Tes candidatures restent dans <strong>ton Google Sheet</strong>. L'appli les lit et les modifie en direct, grâce à un petit script installé sur ton compte Google. Rien ne passe par le site public. À faire <strong>une seule fois, sur le Mac</strong> (5 minutes).</p>
    <ol class="steps">
      <li>Ouvre ton tableau <strong>« Recherche de stage 2027 »</strong> dans Google Sheets.</li>
      <li>Menu <strong>Extensions → Apps Script</strong>. Sélectionne tout (Cmd + A), efface, puis colle ce code à la place :
        <div class="code-box"><button class="btn small" data-copier>${icon('copy', 16)} Copier le code</button><span class="hint" data-copie hidden>Copié ✓</span></div>
        <p class="hint">Le code contient ta clé secrète personnelle. Ne la partage pas.</p>
        <details class="hint"><summary>Le bouton ne marche pas ? Afficher le code</summary>
          <textarea class="code-txt" readonly rows="8" data-code></textarea>
          <p class="hint">Clique dans le cadre, fais Cmd + A puis Cmd + C.</p></details></li>
      <li>Clique sur l'icône disquette pour enregistrer, puis sur <strong>Déployer → Nouveau déploiement</strong>. Choisis le type <strong>« Application Web »</strong> (roue dentée), avec « Exécuter en tant que : <strong>Moi</strong> » et « Qui a accès : <strong>Tout le monde</strong> ». Clique sur Déployer.</li>
      <li>Google demande d'autoriser l'accès : choisis ton compte, puis <strong>Paramètres avancés → Accéder au projet (non sécurisé)</strong> et Autoriser. C'est normal : c'est ton propre script, et il n'a accès qu'à ce tableau.</li>
      <li>Copie l'<strong>URL de l'application Web</strong> (elle se termine par /exec) et colle-la ici :</li>
    </ol>
    <form class="setup-form" data-setup>
      <input name="url" type="url" required placeholder="https://script.google.com/macros/s/…/exec">
      <button class="btn">Relier</button>
    </form>
    <p class="hint">Sur l'iPhone, il suffira de coller la même URL <em>et</em> la même clé : utilise « Copier la clé » ci-dessous et garde-la dans tes notes privées.</p>
    <button class="btn small ghost" data-copier-cle>Copier la clé</button>
    <details class="hint"><summary>J'ai déjà une clé (iPhone)</summary>
      <form class="setup-form" data-cle-form><input name="cle" placeholder="Colle ta clé ici" required><button class="btn small">Utiliser cette clé</button></form>
    </details>
  </section>`;

  const copier = async (txt, zone) => { try { await navigator.clipboard.writeText(txt); if (zone) zone.hidden = false; } catch { prompt('Copie ce texte :', txt); } };
  el.querySelector('[data-code]').value = scriptGoogle(cle);
  el.querySelector('[data-code]').addEventListener('focus', (e) => e.target.select());
  el.querySelector('[data-copier]').addEventListener('click', () => copier(scriptGoogle(lireConf().cle), el.querySelector('[data-copie]')));
  el.querySelector('[data-copier-cle]').addEventListener('click', (e) => { copier(lireConf().cle); e.target.textContent = 'Clé copiée ✓'; });
  el.querySelector('[data-cle-form]').addEventListener('submit', (e) => {
    e.preventDefault(); ecrireConf({ ...lireConf(), cle: e.target.cle.value.trim() }); installation(el, lireConf());
  });
  el.querySelector('[data-setup]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = e.target.url.value.trim();
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Test…';
    try {
      await appel({ url, cle: lireConf().cle }, { action: 'lire' });
      ecrireConf({ ...lireConf(), url, lienSheet: 'https://docs.google.com/spreadsheets/d/1H69xDqDlQkR8xMhBPHXA3Y5IMxVihJXRjINrfwEqRqM/edit' });
      render(el);
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Relier';
      e.target.insertAdjacentHTML('afterend', `<p class="warn">Ça ne marche pas encore : ${esc(err.message)}. Vérifie l'URL (/exec) et que l'accès est sur « Tout le monde ».</p>`);
    }
  });
}
