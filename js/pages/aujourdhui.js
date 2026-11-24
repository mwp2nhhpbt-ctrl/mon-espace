import { store, isoLocal, rdvDuJour } from '../store.js';
import { icon } from '../modules.js';
import { loadActu } from '../actu-data.js';
import { loadLangues, LANGS } from '../langues-data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = isoLocal;

function quand(dateStr) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const x = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((x - t) / 86400000);
  if (diff < 0) return { txt: 'En retard', cls: 'late' };
  if (diff === 0) return { txt: "Aujourd'hui", cls: 'today' };
  if (diff === 1) return { txt: 'Demain', cls: 'tomorrow' };
  return { txt: x.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), cls: '' };
}

function salut() {
  const h = new Date().getHours();
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
}

export function render(el) {
  const s = store.get();
  const todayIso = iso(new Date());
  const rdv = rdvDuJour(s, todayIso);
  const devoirs = [...s.devoirs].sort((a, b) => a.fait - b.fait || a.pour.localeCompare(b.pour));
  const aFaire = devoirs.filter((x) => !x.fait).length;
  const dateLongue = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  el.innerHTML = `
  <header class="hero">
    <p class="hero-date">${dateLongue}</p>
    <h1>${salut()}, Hugues</h1>
    <div class="hero-stats">
      <div><strong>${rdv.length}</strong><span>rendez-vous</span></div>
      <div><strong>${aFaire}</strong><span>devoirs à faire</span></div>
      <div><strong>10</strong><span>mots du jour</span></div>
    </div>
  </header>

  <div class="grid">
    <section class="card" id="card-rdv">
      <div class="card-head"><h2>${icon('clock')} Rendez-vous</h2>
        <button class="icon-btn" data-action="add-rdv" aria-label="Ajouter un rendez-vous">${icon('plus', 18)}</button></div>
      <form class="add-form" data-form="rdv" hidden>
        <input name="heure" type="time" required value="09:00">
        <input name="titre" placeholder="Quoi ?" required>
        <input name="lieu" placeholder="Où ?">
        <button class="btn small">Ajouter</button>
      </form>
      ${rdv.length ? `<ol class="timeline">${rdv.map((r) => `
        <li>
          <time>${esc(r.heure)}</time>
          <div><strong>${esc(r.titre)}${r.repete && r.repete !== 'non' ? ' <i class="rep" title="Répété">↻</i>' : ''}</strong>${r.lieu ? `<span>${icon('pin', 14)} ${esc(r.lieu)}</span>` : ''}</div>
          <button class="del" data-del-rdv="${r.id}" aria-label="Supprimer">${icon('x', 16)}</button>
        </li>`).join('')}</ol>` : '<p class="empty">Rien de prévu aujourd\'hui.</p>'}
    </section>

    <section class="card" id="card-devoirs">
      <div class="card-head"><h2>${icon('book')} Devoirs</h2>
        <button class="icon-btn" data-action="add-devoir" aria-label="Ajouter un devoir">${icon('plus', 18)}</button></div>
      <form class="add-form" data-form="devoir" hidden>
        <input name="titre" placeholder="Devoir" required>
        <input name="matiere" placeholder="Matière">
        <input name="pour" type="date" required value="${todayIso}">
        <button class="btn small">Ajouter</button>
      </form>
      <ul class="todo">${devoirs.map((x) => {
        const q = quand(x.pour);
        return `<li class="${x.fait ? 'done' : ''}">
          <button class="check" data-toggle="${x.id}" aria-label="Marquer comme fait">${icon('check', 14)}</button>
          <div><strong>${esc(x.titre)}</strong><span>${esc(x.matiere || '')}</span></div>
          <em class="due ${x.fait ? '' : q.cls}">${x.fait ? 'Fait' : q.txt}</em>
        </li>`;
      }).join('')}</ul>
    </section>

    <section class="card lesson">
      <div class="card-head"><h2>${icon('chat')} Leçon du jour</h2></div>
      <div data-lecons><p class="empty">Chargement…</p></div>
      <a class="btn ghost" href="#/langues">Commencer la leçon ${icon('arrow', 18)}</a>
    </section>

    <section class="card">
      <div class="card-head"><h2>${icon('globe')} Actu</h2><a class="pill" href="#/actu">Tout voir</a></div>
      <div class="bubbles" data-actu></div>
    </section>
  </div>`;

  // Actu : un article par rubrique, chargé depuis data/actu.json
  loadActu().then((a) => {
    const zone = el.querySelector('[data-actu]');
    if (!zone) return;
    const une = a.rubriques.map((r) => a.articles.find((x) => x.rubrique === r.id)).filter(Boolean).slice(0, 4);
    const nom = (id) => a.rubriques.find((r) => r.id === id)?.nom || '';
    zone.innerHTML = une.map((x) => `
      <a class="bubble rub-${x.rubrique}" href="#/actu">
        <span class="bubble-cat">${esc(nom(x.rubrique))}</span>
        <p>${esc(x.titre)}</p>
        <small>${esc(x.source)}</small>
      </a>`).join('') || '<p class="empty">Pas encore d\'actu aujourd\'hui.</p>';
  });

  // Leçons du jour (anglais + espagnol)
  loadLangues().then((d) => {
    const zone = el.querySelector('[data-lecons]');
    if (!zone) return;
    zone.innerHTML = ['en', 'es'].filter((l) => d[l]).map((l) => `
      <div class="mini-lesson">
        <span class="pill">${LANGS[l].drapeau} ${LANGS[l].nom} · ${esc(d[l].lecon.type)}</span>
        <h3>${esc(d[l].lecon.titre)}</h3>
        <div class="words">${d[l].mots.slice(0, 3).map((m) => `<div class="word"><strong>${esc(m.mot)}</strong><span>${esc(m.trad)}</span></div>`).join('')}</div>
      </div>`).join('') || '<p class="empty">Pas de leçon aujourd\'hui.</p>';
  });

  // Interactions
  el.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    const id = +b.dataset.toggle;
    store.update((st) => { const x = st.devoirs.find((d) => d.id === id); x.fait = !x.fait; });
    render(el);
  }));
  el.querySelectorAll('[data-del-rdv]').forEach((b) => b.addEventListener('click', () => {
    const id = +b.dataset.delRdv;
    store.update((st) => {
      const r = st.rdv.find((x) => x.id === id);
      // Rendez-vous répété : on ne retire que celui d'aujourd'hui
      if (r.repete && r.repete !== 'non') (r.sauf ||= []).push(todayIso);
      else st.rdv = st.rdv.filter((x) => x.id !== id);
    });
    render(el);
  }));
  el.querySelector('[data-action="add-rdv"]').addEventListener('click', () => toggleForm('rdv'));
  el.querySelector('[data-action="add-devoir"]').addEventListener('click', () => toggleForm('devoir'));

  function toggleForm(name) {
    const f = el.querySelector(`[data-form="${name}"]`);
    f.hidden = !f.hidden;
    if (!f.hidden) f.querySelector('input:not([type=time]):not([type=date])').focus();
  }

  el.querySelector('[data-form="rdv"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.update((st) => st.rdv.push({ id: Date.now(), heure: f.get('heure'), titre: f.get('titre'), lieu: f.get('lieu'), date: todayIso }));
    render(el);
  });
  el.querySelector('[data-form="devoir"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.update((st) => st.devoirs.push({ id: Date.now(), titre: f.get('titre'), matiere: f.get('matiere'), pour: f.get('pour'), fait: false }));
    render(el);
  });
}
