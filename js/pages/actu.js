import { icon } from '../modules.js';
import { loadActu, BORDS, LANGUES } from '../actu-data.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vue = { filtre: 'tout' };

export async function render(el) {
  el.innerHTML = '<p class="empty">Chargement de la revue de presse…</p>';
  const a = await loadActu();
  const nom = (id) => a.rubriques.find((r) => r.id === id)?.nom || '';
  const date = new Date((a.date || '') + 'T00:00:00');
  const dateTxt = isNaN(date) ? '' : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const articles = a.articles.filter((x) => vue.filtre === 'tout' || x.rubrique === vue.filtre);

  el.innerHTML = `
  <header class="page-head">
    <div><p class="eyebrow">Revue de presse</p><h1 class="cap">${esc(dateTxt)}</h1></div>
    ${a.demo ? '<span class="pill muted">Données de démonstration</span>' : ''}
  </header>

  ${a.synthese ? `<section class="hero hero-small">
    <p class="hero-date">L'essentiel du jour</p>
    <p class="synthese">${esc(a.synthese)}</p>
  </section>` : ''}

  <nav class="filters" aria-label="Rubriques">
    ${[{ id: 'tout', nom: 'Tout' }, ...a.rubriques].map((r) =>
      `<button class="filter rub-${r.id}${vue.filtre === r.id ? ' on' : ''}" data-filtre="${r.id}">${esc(r.nom)}</button>`).join('')}
  </nav>

  <section class="press-grid">
    ${articles.map((x) => `
      <a class="press rub-${x.rubrique}" href="${esc(x.url)}" target="_blank" rel="noopener">
        <div class="press-top">
          <span class="bubble-cat">${esc(nom(x.rubrique))}</span>
          ${x.bord ? `<span class="bord bord-${x.bord}">${BORDS[x.bord]}</span>` : ''}
          ${x.vo ? `<span class="vo">${LANGUES[x.vo]?.drapeau || ''} traduit</span>` : ''}
        </div>
        <h3>${esc(x.titre)}</h3>
        <p>${esc(x.resume)}</p>
        <small>${esc(x.source)} ${icon('arrow', 14)}</small>
      </a>`).join('') || '<p class="empty">Rien dans cette rubrique aujourd\'hui.</p>'}
  </section>

  <header class="section-head">
    <h2>${icon('chat')} Lire en VO</h2>
    <p>Articles laissés dans leur langue d'origine, pour t'entraîner.</p>
  </header>
  <section class="vo-grid">
    ${a.lecture.map((l, i) => `
      <article class="card vo-card lang-${l.langue}">
        <div class="card-head">
          <span class="pill">${LANGUES[l.langue]?.drapeau || ''} ${LANGUES[l.langue]?.nom || l.langue}</span>
          <small class="muted">${esc(nom(l.rubrique))} · ${esc(l.source)}</small>
        </div>
        <h3 lang="${l.langue}">${esc(l.titre)}</h3>
        <div class="vo-text" lang="${l.langue}" data-texte="${i}">
          ${l.texte.map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>
        <button class="link-btn" data-lire="${i}">Lire la suite</button>
        <div class="vo-actions">
          <button class="btn small ghost" data-vocab="${i}" aria-expanded="false">${icon('book', 16)} Afficher le vocabulaire clé</button>
          ${l.url ? `<a class="btn small ghost" href="${esc(l.url)}" target="_blank" rel="noopener">Source ${icon('arrow', 16)}</a>` : ''}
        </div>
        <dl class="vocab" data-liste="${i}" hidden>
          ${l.vocab.map((v) => `<div><dt lang="${l.langue}">${esc(v.mot)}</dt><dd>${esc(v.trad)}</dd></div>`).join('')}
        </dl>
      </article>`).join('')}
  </section>`;

  el.querySelectorAll('[data-filtre]').forEach((b) => b.addEventListener('click', () => { vue.filtre = b.dataset.filtre; render(el); }));
  el.querySelectorAll('[data-lire]').forEach((b) => b.addEventListener('click', () => {
    const t = el.querySelector(`[data-texte="${b.dataset.lire}"]`);
    t.classList.toggle('open');
    b.textContent = t.classList.contains('open') ? 'Réduire' : 'Lire la suite';
  }));
  el.querySelectorAll('[data-vocab]').forEach((b) => b.addEventListener('click', () => {
    const l = el.querySelector(`[data-liste="${b.dataset.vocab}"]`);
    l.hidden = !l.hidden;
    b.setAttribute('aria-expanded', String(!l.hidden));
    b.lastChild.textContent = l.hidden ? ' Afficher le vocabulaire clé' : ' Masquer le vocabulaire';
  }));
}
