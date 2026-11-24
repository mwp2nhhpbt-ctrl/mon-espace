import { icon } from '../modules.js';
import { isoLocal } from '../store.js';
import { loadLangues, loadSemaine, LANGS, progres, saveProgres, marquerJour, speak, ecouter, reconnaissanceDispo, scoreOral } from '../langues-data.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const melange = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
const vue = { langue: 'en' };

export async function render(el) {
  el.innerHTML = '<p class="empty">Chargement…</p>';
  const data = await loadLangues();
  const L = vue.langue;
  const j = data[L];
  const p = progres();
  const today = isoLocal(new Date());
  const cle = (x) => `${data.date}-${L}-${x}`;
  const fait = (x) => !!p.faits[cle(x)];
  const nbMots = p.mots[L].length;
  const weekend = [0, 6].includes(new Date().getDay());

  if (!j) { el.innerHTML = '<p class="empty">Pas de leçon disponible aujourd\'hui.</p>'; return; }

  el.innerHTML = `
  <header class="page-head">
    <div><p class="eyebrow">Langues</p><h1>${LANGS[L].drapeau} ${LANGS[L].nom}</h1></div>
    <div class="lang-switch" role="tablist">
      ${Object.entries(LANGS).map(([k, v]) => `<button role="tab" class="${k === L ? 'on' : ''}" data-langue="${k}">${v.drapeau} ${v.nom}</button>`).join('')}
    </div>
  </header>

  <section class="lang-stats">
    <div><span class="big">🔥 ${p.serie.n}</span><small>jour${p.serie.n > 1 ? 's' : ''} de suite</small></div>
    <div><span class="big">⚡ ${p.xp}</span><small>XP</small></div>
    <div><span class="big">📚 ${nbMots}</span><small>mots appris</small></div>
  </section>

  <div class="lang-grid">
    <section class="card lesson-card">
      <div class="card-head"><span class="pill">${esc(j.lecon.type)}</span>${fait('lecon') ? '<span class="done-tag">✓ Terminée</span>' : ''}</div>
      <h2 class="lesson-title">${esc(j.lecon.titre)}</h2>
      ${j.lecon.explication.map((x) => `<p class="expl">${md(x)}</p>`).join('')}
      <div class="examples">
        ${j.lecon.exemples.map((e) => `
          <div class="ex">
            <button class="speak" data-dire="${esc(e.vo)}" aria-label="Écouter">${icon('volume', 16)}</button>
            <div><strong lang="${L}">${esc(e.vo)}</strong><span>${esc(e.fr)}</span></div>
          </div>`).join('')}
      </div>
      <button class="btn big-btn" data-exos>${fait('lecon') ? 'Refaire les exercices' : `Commencer les exercices · ${j.lecon.exercices.length} questions`} ${icon('arrow', 18)}</button>
    </section>

    <section class="card">
      <div class="card-head"><h2>${icon('book')} 5 mots du jour</h2>${fait('mots') ? '<span class="done-tag">✓ Appris</span>' : ''}</div>
      <p class="hint">Touche une carte pour voir la traduction.</p>
      <div class="flashcards">
        ${j.mots.map((m, i) => `
          <div class="flash" data-flash="${i}" tabindex="0" role="button" aria-label="Retourner la carte">
            <div class="flash-front"><strong lang="${L}">${esc(m.mot)}</strong>
              <button class="speak small" data-dire="${esc(m.mot)}" aria-label="Écouter">${icon('volume', 14)}</button></div>
            <div class="flash-back"><strong>${esc(m.trad)}</strong><em lang="${L}">${esc(m.exemple)}</em></div>
          </div>`).join('')}
      </div>
      <button class="btn ghost" data-apprendre ${fait('mots') ? 'disabled' : ''}>${fait('mots') ? '✓ Ajoutés à mes mots' : 'Je les connais · +10 XP'}</button>
    </section>

    <section class="card">
      <div class="card-head"><h2>${icon('mic')} Oral</h2></div>
      <h3 class="sub">1. Écoute et répète</h3>
      ${reconnaissanceDispo() ? '' : '<p class="warn">Le micro n\'est pas pris en charge par ce navigateur. Ouvre l\'appli dans Safari ou Chrome pour t\'entraîner à l\'oral.</p>'}
      <ul class="repeat">
        ${j.oral.repeter.map((t, i) => `
          <li>
            <p lang="${L}">${esc(t)}</p>
            <div class="repeat-actions">
              <button class="btn small ghost" data-dire="${esc(t)}">${icon('volume', 16)} Écouter</button>
              <button class="btn small" data-repeter="${i}">${icon('mic', 16)} Répéter</button>
            </div>
            <div class="oral-result" data-res="${i}"></div>
          </li>`).join('')}
      </ul>
      <h3 class="sub">2. Réponds à voix haute</h3>
      <p class="question" lang="${L}">${esc(j.oral.question)}</p>
      <p class="hint">${esc(j.oral.aide)}</p>
      <button class="btn small" data-libre>${icon('mic', 16)} Parler</button>
      <div class="oral-libre" data-libre-res></div>
    </section>

    <section class="card">
      <div class="card-head"><h2>${icon('edit')} Expression écrite</h2>${fait('ecrit') ? '<span class="done-tag">✓ Écrit</span>' : ''}</div>
      <p class="question">${esc(j.ecrit.sujet)}</p>
      <p class="hint">${esc(j.ecrit.conseils)}</p>
      <div class="imposes">${j.ecrit.mots_imposes.map((m) => `<span class="chip-word" data-impose="${esc(m)}">${esc(m)}</span>`).join('')}</div>
      <textarea class="writing" lang="${L}" rows="7" data-ecrit placeholder="Écris ton texte ici…">${esc(p.brouillons[cle('ecrit')] || '')}</textarea>
      <div class="writing-foot"><span data-compte>0 mot</span>
        <button class="btn small" data-corriger>Faire corriger par Claude</button></div>
      <p class="hint" data-copie hidden>Texte copié ✓ Colle-le dans la conversation Claude qui vient de s'ouvrir.</p>
    </section>

    <section class="card eval-card ${weekend ? 'highlight' : ''}">
      <div class="card-head"><h2>${icon('check')} Évaluation de la semaine</h2>${weekend ? '<span class="pill">C\'est le moment !</span>' : ''}</div>
      <p>Un quiz sur tous les mots et toutes les leçons des 7 derniers jours. ${weekend ? '' : 'Elle est prévue le week-end, mais tu peux t\'entraîner quand tu veux.'}</p>
      ${p.evals.filter((e) => e.langue === L).slice(-1).map((e) => `<p class="hint">Dernier score : <strong>${e.score}/${e.total}</strong> le ${new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>`).join('')}
      <button class="btn" data-eval>Lancer l'évaluation ${icon('arrow', 18)}</button>
    </section>

    <section class="card">
      <details>
        <summary><h2>${icon('book')} Mes mots (${nbMots})</h2></summary>
        ${nbMots ? `<dl class="vocab mes-mots">${[...p.mots[L]].reverse().map((m) => `<div><dt lang="${L}">${esc(m.mot)}</dt><dd>${esc(m.trad)}</dd></div>`).join('')}</dl>` : '<p class="empty">Valide les mots du jour pour les retrouver ici.</p>'}
      </details>
    </section>
  </div>
  <div class="quiz-layer" data-quiz hidden></div>`;

  const on = (s, ev, fn) => el.querySelectorAll(s).forEach((b) => b.addEventListener(ev, (e) => fn(b, e)));

  on('[data-langue]', 'click', (b) => { vue.langue = b.dataset.langue; render(el); });
  on('[data-dire]', 'click', (b, e) => { e.stopPropagation(); speak(b.dataset.dire, L); });
  on('[data-flash]', 'click', (b) => b.classList.toggle('flipped'));
  on('[data-flash]', 'keydown', (b, e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.classList.toggle('flipped'); } });

  on('[data-apprendre]', 'click', () => {
    const pr = progres();
    for (const m of j.mots) if (!pr.mots[L].some((x) => x.mot === m.mot)) pr.mots[L].push({ mot: m.mot, trad: m.trad, date: data.date });
    pr.faits[cle('mots')] = true; pr.xp += 10; marquerJour(pr, today);
    saveProgres(pr); render(el);
  });

  // Oral : répéter
  on('[data-repeter]', 'click', async (b) => {
    const i = +b.dataset.repeter, zone = el.querySelector(`[data-res="${i}"]`);
    zone.innerHTML = '<span class="listening">🎙️ Je t\'écoute…</span>';
    try {
      const dit = await ecouter(L);
      const { score, mots } = scoreOral(j.oral.repeter[i], dit);
      zone.innerHTML = `<div class="score ${score >= 80 ? 'good' : score >= 50 ? 'mid' : 'low'}">${score} %</div>
        <p class="said">${mots.map((w) => `<span class="${w.ok ? 'ok' : 'ko'}">${esc(w.mot)}</span>`).join(' ')}</p>
        <small>Compris : « ${esc(dit)} »</small>`;
      if (score >= 80) { const pr = progres(); pr.xp += 5; marquerJour(pr, today); saveProgres(pr); }
    } catch (err) { zone.innerHTML = `<p class="warn">${esc(err.message)}</p>`; }
  });

  // Oral : réponse libre
  on('[data-libre]', 'click', async () => {
    const zone = el.querySelector('[data-libre-res]');
    zone.innerHTML = '<span class="listening">🎙️ Je t\'écoute… Parle tranquillement, puis fais une pause.</span>';
    try {
      const dit = await ecouter(L, true);
      zone.innerHTML = `<p class="said-free" lang="${L}">« ${esc(dit)} »</p>
        <p class="hint">${dit.split(/\s+/).length} mots. Pour une correction détaillée (grammaire, vocabulaire), envoie-la à Claude.</p>
        <button class="btn small ghost" data-corriger-oral>Faire corriger par Claude</button>`;
      zone.querySelector('[data-corriger-oral]').addEventListener('click', () => corriger(`Voici ma réponse orale (transcrite automatiquement) en ${LANGS[L].nom.toLowerCase()} à la question : « ${j.oral.question} »\n\n« ${dit} »\n\nCorrige mes erreurs de grammaire et de vocabulaire, explique-les simplement en français, puis propose une version améliorée de niveau B2.`, zone));
      const pr = progres(); pr.xp += 10; marquerJour(pr, today); saveProgres(pr);
    } catch (err) { zone.innerHTML = `<p class="warn">${esc(err.message)}</p>`; }
  });

  // Écrit
  const ta = el.querySelector('[data-ecrit]');
  const majEcrit = () => {
    const txt = ta.value.trim();
    const n = txt ? txt.split(/\s+/).length : 0;
    el.querySelector('[data-compte]').textContent = `${n} mot${n > 1 ? 's' : ''}`;
    el.querySelectorAll('[data-impose]').forEach((c) => {
      const racine = c.dataset.impose.toLowerCase().replace(/^(to |el |la |las |los )/, '');
      c.classList.toggle('used', txt.toLowerCase().includes(racine));
    });
    const pr = progres(); pr.brouillons[cle('ecrit')] = ta.value; saveProgres(pr);
  };
  ta.addEventListener('input', majEcrit); majEcrit();
  on('[data-corriger]', 'click', () => {
    if (ta.value.trim().split(/\s+/).length < 20) { ta.focus(); ta.placeholder = 'Écris au moins 20 mots avant de demander une correction.'; return; }
    const pr = progres();
    if (!pr.faits[cle('ecrit')]) { pr.faits[cle('ecrit')] = true; pr.xp += 15; marquerJour(pr, today); saveProgres(pr); }
    corriger(`Je suis étudiant en L3 LEA. Voici mon expression écrite en ${LANGS[L].nom.toLowerCase()}.\nSujet : ${j.ecrit.sujet}\nMots imposés : ${j.ecrit.mots_imposes.join(', ')}\n\nMon texte :\n${ta.value.trim()}\n\nCorrige mes erreurs (grammaire, vocabulaire, ton), explique chaque correction en français, donne une note sur 20 et propose une version améliorée.`, el.querySelector('[data-copie]'));
  });

  // Exercices et évaluation
  on('[data-exos]', 'click', () => quiz(el, j.lecon.exercices, L, (score, total) => {
    const pr = progres();
    if (!pr.faits[cle('lecon')]) pr.xp += 10 + score * 2;
    pr.faits[cle('lecon')] = true; marquerJour(pr, today); saveProgres(pr);
  }));
  on('[data-eval]', 'click', async () => {
    const semaine = await loadSemaine();
    const questions = construireEval(semaine, L);
    if (!questions.length) return;
    quiz(el, questions, L, (score, total) => {
      const pr = progres(); pr.evals.push({ date: today, langue: L, score, total }); pr.xp += score * 3; saveProgres(pr);
    }, 'Évaluation de la semaine');
  });
}

async function corriger(texte, zoneInfo) {
  try { await navigator.clipboard.writeText(texte); } catch { /* le presse-papiers peut être refusé */ }
  window.open('https://claude.ai/new', '_blank', 'noopener');
  if (zoneInfo?.hasAttribute?.('data-copie')) zoneInfo.hidden = false;
  else if (zoneInfo) zoneInfo.insertAdjacentHTML('beforeend', '<p class="hint">Texte copié ✓ Colle-le dans Claude.</p>');
}

function construireEval(semaine, L) {
  const jours = (semaine.jours || []).filter((x) => x[L]);
  const mots = jours.flatMap((x) => x[L].mots);
  const qMots = melange(mots).slice(0, 8).map((m) => {
    const versFr = Math.random() < 0.5;
    const autres = melange(mots.filter((x) => x.mot !== m.mot)).slice(0, 2);
    const bonne = versFr ? m.trad : m.mot;
    const choix = melange([bonne, ...autres.map((a) => (versFr ? a.trad : a.mot))]);
    return { type: 'qcm', question: versFr ? `Que veut dire « ${m.mot} » ?` : `Comment dit-on « ${m.trad} » ?`, choix, reponse: choix.indexOf(bonne), explication: `${m.mot} = ${m.trad}` };
  }).filter((q) => q.choix.length >= 2);
  const qExos = melange(jours.flatMap((x) => x[L].exercices)).slice(0, 7);
  return melange([...qMots, ...qExos]);
}

// ===== Lecteur d'exercices façon Duolingo =====
const norm = (s) => s.toLowerCase().trim().replace(/[.!?¡¿,;]/g, '').replace(/\s+/g, ' ');
const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function quiz(el, questions, L, fin, titre = 'Exercices') {
  const layer = el.querySelector('[data-quiz]');
  let i = 0, score = 0;
  layer.hidden = false;
  document.body.classList.add('no-scroll');

  const fermer = () => { layer.hidden = true; layer.innerHTML = ''; document.body.classList.remove('no-scroll'); render(el); };

  function afficher() {
    const q = questions[i];
    let reponseOrdre = [];
    layer.innerHTML = `
      <div class="quiz">
        <div class="quiz-top">
          <button class="icon-btn" data-quit aria-label="Quitter">${icon('x', 18)}</button>
          <div class="bar"><i style="width:${(i / questions.length) * 100}%"></i></div>
          <span class="quiz-count">${i + 1}/${questions.length}</span>
        </div>
        <p class="eyebrow">${esc(titre)}</p>
        ${q.type === 'qcm' ? `<h2 lang="${L}">${esc(q.question)}</h2>
          <div class="choices">${q.choix.map((c, k) => `<button class="choice" data-choix="${k}">${esc(c)}</button>`).join('')}</div>` : ''}
        ${q.type === 'trou' ? `<h2>Complète la phrase</h2><p class="trou" lang="${L}">${esc(q.phrase)}</p>
          <input class="trou-input" data-trou autocomplete="off" autocapitalize="off" spellcheck="false" lang="${L}" placeholder="Ta réponse">` : ''}
        ${q.type === 'ordre' ? `<h2>Traduis en remettant les mots dans l'ordre</h2><p class="trou">${esc(q.fr)}</p>
          <div class="ordre-zone" data-zone></div>
          <div class="ordre-mots">${melange(q.mots).map((m, k) => `<button class="word-chip" data-mot="${k}" lang="${L}">${esc(m)}</button>`).join('')}</div>` : ''}
        <div class="quiz-foot" data-foot>
          <button class="btn big-btn" data-verifier disabled>Vérifier</button>
        </div>
      </div>`;

    const verif = layer.querySelector('[data-verifier]');
    let choix = null;
    layer.querySelector('[data-quit]').addEventListener('click', fermer);
    layer.querySelectorAll('[data-choix]').forEach((b) => b.addEventListener('click', () => {
      layer.querySelectorAll('[data-choix]').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel'); choix = +b.dataset.choix; verif.disabled = false;
    }));
    const input = layer.querySelector('[data-trou]');
    if (input) { input.focus(); input.addEventListener('input', () => { verif.disabled = !input.value.trim(); }); input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) verif.click(); }); }
    layer.querySelectorAll('[data-mot]').forEach((b) => b.addEventListener('click', () => {
      const zone = layer.querySelector('[data-zone]');
      if (b.parentElement === zone) { layer.querySelector('.ordre-mots').append(b); reponseOrdre = reponseOrdre.filter((x) => x !== b); }
      else { zone.append(b); reponseOrdre.push(b); }
      verif.disabled = !reponseOrdre.length;
    }));

    verif.addEventListener('click', () => {
      let ok = false, note = '', bonne = '';
      if (q.type === 'qcm') { ok = choix === q.reponse; bonne = q.choix[q.reponse]; }
      if (q.type === 'trou') {
        const r = norm(input.value);
        const attendues = q.reponse.map(norm);
        ok = attendues.includes(r);
        if (!ok && attendues.map(sansAccents).includes(sansAccents(r))) { ok = true; note = 'Attention aux accents !'; }
        bonne = q.reponse[0];
      }
      if (q.type === 'ordre') { ok = norm(reponseOrdre.map((b) => b.textContent).join(' ')) === norm(q.reponse); bonne = q.reponse; }
      if (ok) score++;
      if (q.type === 'qcm') layer.querySelectorAll('[data-choix]').forEach((b) => { b.disabled = true; if (+b.dataset.choix === q.reponse) b.classList.add('right'); else if (b.classList.contains('sel')) b.classList.add('wrong'); });
      layer.querySelector('[data-foot]').outerHTML = `
        <div class="quiz-foot feedback ${ok ? 'ok' : 'ko'}">
          <div><strong>${ok ? 'Bravo !' : 'Pas tout à fait…'}</strong>
            ${!ok ? `<p>Bonne réponse : <b lang="${L}">${esc(bonne)}</b></p>` : ''}
            ${note ? `<p>${esc(note)}</p>` : ''}
            ${q.explication ? `<p>${esc(q.explication)}</p>` : ''}</div>
          <button class="btn big-btn" data-suivant>Continuer</button>
        </div>`;
      if (!ok) speak(bonne, L);
      layer.querySelector('[data-suivant]').addEventListener('click', () => { i++; i < questions.length ? afficher() : resultat(); });
      layer.querySelector('[data-suivant]').focus();
    });
  }

  function resultat() {
    fin(score, questions.length);
    const pct = Math.round((score / questions.length) * 100);
    layer.innerHTML = `
      <div class="quiz quiz-end">
        <div class="end-emoji">${pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📖'}</div>
        <h2>${pct >= 80 ? 'Excellent !' : pct >= 50 ? 'Bien joué !' : 'Continue, ça va venir !'}</h2>
        <p class="end-score">${score} / ${questions.length}</p>
        <button class="btn big-btn" data-fin>Terminer</button>
      </div>`;
    layer.querySelector('[data-fin]').addEventListener('click', fermer);
  }

  afficher();
}
