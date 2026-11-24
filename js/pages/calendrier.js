import { store, isoLocal, rdvDuJour, REPETITIONS } from '../store.js';
import { icon } from '../modules.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const COULEURS = { violet: '#6050DC', rouge: '#E5484D', vert: '#18A06A', orange: '#E0861B', rose: '#D6407A' };
const estRepete = (r) => r.repete && r.repete !== 'non';

// État de la vue, gardé tant que l'appli est ouverte.
const vue = { mois: null, jour: null, couleur: 'violet', edition: null, suppression: null };

export function render(el) {
  const s = store.get();
  const todayIso = isoLocal(new Date());
  if (!vue.jour) vue.jour = todayIso;
  if (!vue.mois) { const t = new Date(); vue.mois = new Date(t.getFullYear(), t.getMonth(), 1); }

  const annee = vue.mois.getFullYear(), m = vue.mois.getMonth();
  const decalage = (new Date(annee, m, 1).getDay() + 6) % 7; // lundi = 0
  const titreMois = vue.mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const parJour = (iso) => ({
    rdv: rdvDuJour(s, iso),
    devoirs: s.devoirs.filter((d) => d.pour === iso),
    notes: s.notes[iso] || []
  });

  // Grille de 6 semaines pour une hauteur stable
  const cases = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(annee, m, 1 - decalage + i);
    const iso = isoLocal(date);
    const j = parJour(iso);
    const cls = ['day'];
    if (date.getMonth() !== m) cls.push('out');
    if (iso === todayIso) cls.push('today');
    if (iso === vue.jour) cls.push('selected');
    const points = [...j.rdv.map(() => '<i class="dot rdv"></i>'), ...j.devoirs.map(() => '<i class="dot devoir"></i>')].slice(0, 4).join('');
    const bande = j.notes.length
      ? `<span class="note-bar">${j.notes.slice(0, 4).map((n) => `<i style="background:${COULEURS[n.couleur] || COULEURS.violet}"></i>`).join('')}</span>` : '';
    const chips = [
      ...j.rdv.map((r) => `<span class="chip">${esc(r.heure)} ${esc(r.titre)}</span>`),
      ...j.notes.map((n) => `<span class="chip note" style="--note:${COULEURS[n.couleur] || COULEURS.violet}">${esc(n.texte)}</span>`)
    ];
    cases.push(`
      <button class="${cls.join(' ')}" data-jour="${iso}">
        <span class="num">${date.getDate()}</span>
        <span class="dots">${points}</span>
        ${chips.slice(0, 2).join('')}
        ${chips.length > 2 ? `<span class="more">+${chips.length - 2}</span>` : ''}
        ${bande}
      </button>`);
  }

  const sel = parJour(vue.jour);
  const selTitre = new Date(vue.jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const noteEditee = vue.edition && sel.notes.find((n) => n.id === vue.edition);
  if (noteEditee) vue.couleur = noteEditee.couleur;

  el.innerHTML = `
  <header class="page-head">
    <div><p class="eyebrow">Calendrier</p><h1 class="cap">${titreMois}</h1></div>
    <div class="month-nav">
      <button class="icon-btn" data-nav="-1" aria-label="Mois précédent">${icon('left', 18)}</button>
      <button class="btn small ghost" data-nav="0">Aujourd'hui</button>
      <button class="icon-btn" data-nav="1" aria-label="Mois suivant">${icon('right', 18)}</button>
    </div>
  </header>

  <div class="cal-layout">
    <section class="card cal">
      <div class="weekdays">${JOURS.map((j) => `<span>${j}</span>`).join('')}</div>
      <div class="days">${cases.join('')}</div>
      <div class="legend"><span><i class="dot rdv"></i> Rendez-vous</span><span><i class="dot devoir"></i> Devoir</span><span><i class="note-bar static"><i></i></i> Notes</span></div>
    </section>

    <aside class="card day-panel">
      <h2 class="cap">${selTitre}</h2>

      <div class="panel-block">
        <div class="card-head"><h3>${icon('note', 18)} Notes${sel.notes.length ? ` <small>${sel.notes.length}</small>` : ''}</h3></div>
        ${sel.notes.length ? `<ul class="notes">${sel.notes.map((n) => `
          <li style="--note:${COULEURS[n.couleur] || COULEURS.violet}" class="${n.id === vue.edition ? 'editing' : ''}">
            <p>${esc(n.texte)}</p>
            <button class="del" data-edit-note="${n.id}" aria-label="Modifier">${icon('edit', 15)}</button>
            <button class="del" data-del-note="${n.id}" aria-label="Supprimer">${icon('x', 15)}</button>
          </li>`).join('')}</ul>` : ''}
        <form class="note-form" data-form="note">
          <textarea name="texte" rows="2" placeholder="Ajouter une note pour ce jour…" required>${noteEditee ? esc(noteEditee.texte) : ''}</textarea>
          <div class="note-form-row">
            <div class="colors" role="radiogroup" aria-label="Couleur">
              ${Object.entries(COULEURS).map(([nom, hex]) => `<button type="button" class="color${nom === vue.couleur ? ' on' : ''}" data-couleur="${nom}" style="--c:${hex}" aria-label="${nom}"></button>`).join('')}
            </div>
            ${noteEditee ? '<button type="button" class="btn small ghost" data-cancel>Annuler</button>' : ''}
            <button class="btn small">${noteEditee ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </div>

      <div class="panel-block">
        <div class="card-head"><h3>${icon('clock', 18)} Rendez-vous</h3>
          <button class="icon-btn" data-action="add-rdv" aria-label="Ajouter un rendez-vous">${icon('plus', 18)}</button></div>
        <form class="add-form" data-form="rdv" hidden>
          <input name="heure" type="time" required value="09:00">
          <input name="titre" placeholder="Quoi ? (ex : cours d'espagnol)" required>
          <input name="lieu" placeholder="Où ?">
          <label class="field">Répéter
            <select name="repete">${Object.entries(REPETITIONS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          </label>
          <label class="field" data-jusqu hidden>Jusqu'au
            <input name="jusqu" type="date">
          </label>
          <button class="btn small">Ajouter</button>
        </form>
        ${sel.rdv.length ? `<ol class="timeline">${sel.rdv.map((r) => `
          <li><time>${esc(r.heure)}</time>
            <div><strong>${esc(r.titre)}</strong>
              <span>${r.lieu ? `${icon('pin', 14)} ${esc(r.lieu)}` : ''}${estRepete(r) ? `<b class="rep-tag">↻ ${REPETITIONS[r.repete]}</b>` : ''}</span>
              ${vue.suppression === r.id ? `<div class="confirm">
                <button class="btn small ghost" data-suppr-jour="${r.id}">Ce jour seulement</button>
                <button class="btn small danger" data-suppr-serie="${r.id}">Toute la série</button></div>` : ''}
            </div>
            <button class="del" data-del-rdv="${r.id}" aria-label="Supprimer">${icon('x', 16)}</button></li>`).join('')}</ol>`
          : '<p class="empty">Aucun rendez-vous.</p>'}
      </div>

      ${sel.devoirs.length ? `<div class="panel-block">
        <div class="card-head"><h3>${icon('book', 18)} Devoirs à rendre</h3></div>
        <ul class="todo">${sel.devoirs.map((x) => `<li class="${x.fait ? 'done' : ''}">
          <button class="check" data-toggle="${x.id}" aria-label="Marquer comme fait">${icon('check', 14)}</button>
          <div><strong>${esc(x.titre)}</strong><span>${esc(x.matiere || '')}</span></div></li>`).join('')}</ul>
      </div>` : ''}
    </aside>
  </div>`;

  const on = (sel, ev, fn) => el.querySelectorAll(sel).forEach((b) => b.addEventListener(ev, (e) => fn(b, e)));
  const rerender = () => render(el);

  // Mois
  on('[data-nav]', 'click', (b) => {
    const n = +b.dataset.nav;
    if (n === 0) { const t = new Date(); vue.mois = new Date(t.getFullYear(), t.getMonth(), 1); vue.jour = todayIso; }
    else vue.mois = new Date(annee, m + n, 1);
    rerender();
  });

  // Jour
  on('[data-jour]', 'click', (b) => {
    vue.jour = b.dataset.jour; vue.edition = null; vue.suppression = null;
    const d = new Date(vue.jour + 'T00:00:00');
    if (d.getMonth() !== m) vue.mois = new Date(d.getFullYear(), d.getMonth(), 1);
    rerender();
    if (window.matchMedia('(max-width: 1100px)').matches) el.querySelector('.day-panel').scrollIntoView({ behavior: 'smooth' });
  });

  // Notes
  on('[data-couleur]', 'click', (b) => {
    vue.couleur = b.dataset.couleur;
    el.querySelectorAll('[data-couleur]').forEach((c) => c.classList.toggle('on', c === b));
  });
  el.querySelector('[data-form="note"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const texte = new FormData(e.target).get('texte').trim();
    if (!texte) return;
    store.update((st) => {
      const liste = (st.notes[vue.jour] ||= []);
      const n = liste.find((x) => x.id === vue.edition);
      if (n) Object.assign(n, { texte, couleur: vue.couleur });
      else liste.push({ id: Date.now(), texte, couleur: vue.couleur });
    });
    vue.edition = null;
    rerender();
  });
  on('[data-cancel]', 'click', () => { vue.edition = null; rerender(); });
  on('[data-edit-note]', 'click', (b) => { vue.edition = +b.dataset.editNote; rerender(); el.querySelector('[data-form="note"] textarea').focus(); });
  on('[data-del-note]', 'click', (b) => {
    const id = +b.dataset.delNote;
    store.update((st) => {
      st.notes[vue.jour] = (st.notes[vue.jour] || []).filter((n) => n.id !== id);
      if (!st.notes[vue.jour].length) delete st.notes[vue.jour];
    });
    if (vue.edition === id) vue.edition = null;
    rerender();
  });

  // Rendez-vous
  const formRdv = el.querySelector('[data-form="rdv"]');
  on('[data-action="add-rdv"]', 'click', () => { formRdv.hidden = !formRdv.hidden; if (!formRdv.hidden) formRdv.titre.focus(); });
  formRdv.repete.addEventListener('change', () => { el.querySelector('[data-jusqu]').hidden = formRdv.repete.value === 'non'; });
  formRdv.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(formRdv);
    store.update((st) => st.rdv.push({
      id: Date.now(), heure: f.get('heure'), titre: f.get('titre'), lieu: f.get('lieu'), date: vue.jour,
      repete: f.get('repete'), jusqu: f.get('repete') !== 'non' && f.get('jusqu') ? f.get('jusqu') : undefined
    }));
    rerender();
  });
  on('[data-del-rdv]', 'click', (b) => {
    const id = +b.dataset.delRdv;
    const r = s.rdv.find((x) => x.id === id);
    if (estRepete(r)) { vue.suppression = vue.suppression === id ? null : id; return rerender(); }
    store.update((st) => { st.rdv = st.rdv.filter((x) => x.id !== id); });
    rerender();
  });
  on('[data-suppr-jour]', 'click', (b) => {
    const id = +b.dataset.supprJour;
    store.update((st) => { const r = st.rdv.find((x) => x.id === id); (r.sauf ||= []).push(vue.jour); });
    vue.suppression = null; rerender();
  });
  on('[data-suppr-serie]', 'click', (b) => {
    const id = +b.dataset.supprSerie;
    store.update((st) => { st.rdv = st.rdv.filter((x) => x.id !== id); });
    vue.suppression = null; rerender();
  });
  on('[data-toggle]', 'click', (b) => {
    const id = +b.dataset.toggle;
    store.update((st) => { const x = st.devoirs.find((d) => d.id === id); x.fait = !x.fait; });
    rerender();
  });
}
